import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs/promises";
import path from "path";
import postgres from "postgres";

const r2AccountId = process.env.R2_ACCOUNT_ID;
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const r2BucketName = process.env.R2_BUCKET_NAME;
const r2PublicUrl = process.env.R2_PUBLIC_URL;

const hasR2Config = Boolean(
  r2AccountId && r2AccessKeyId && r2SecretAccessKey && r2BucketName
);

let s3Client: S3Client | null = null;

if (hasR2Config) {
  s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: r2AccessKeyId!,
      secretAccessKey: r2SecretAccessKey!,
    },
  });
}

const connectionString = process.env.DATABASE_URL;
let pgClient: postgres.Sql | null = null;

function getPgClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!pgClient && connectionString) {
    const isSsl = connectionString.includes("sslmode=require") || process.env.NODE_ENV === "production";
    pgClient = postgres(connectionString, {
      ssl: isSsl ? { rejectUnauthorized: false } : false,
      max: 5,
      idle_timeout: 30,
      connect_timeout: 10,
    });
  }
  return pgClient;
}

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".bmp": "image/bmp",
  ".avif": "image/avif",
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".jfif": "image/jpeg",
};

export async function uploadImage(
  buffer: Buffer,
  fileName: string,
  contentType: string
): Promise<{ url: string; storageKey: string }> {
  const sanitizedName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const storageKey = `submissions/${sanitizedName}`;

  if (hasR2Config && s3Client) {
    // Cloudflare R2 ga yuklash
    await s3Client.send(
      new PutObjectCommand({
        Bucket: r2BucketName,
        Key: storageKey,
        Body: buffer,
        ContentType: contentType,
      })
    );

    const publicDomain = r2PublicUrl?.replace(/\/$/, "") || `https://${r2BucketName}.r2.dev`;
    return {
      url: `${publicDomain}/${storageKey}`,
      storageKey,
    };
  } else {
    // R2 sozlanmagan bo'lsa, rasmni DOIMIY PostgreSQL bazasida saqlaymiz (git va ephemeral diskka bog'liq emas!)
    const base64Data = buffer.toString("base64");
    const sql = getPgClient();
    if (sql) {
      try {
        await sql`
          INSERT INTO uploaded_files (id, file_name, content_type, data)
          VALUES (${sanitizedName}, ${fileName}, ${contentType}, ${base64Data})
          ON CONFLICT (id) DO UPDATE SET data = ${base64Data}, content_type = ${contentType};
        `;
      } catch (err) {
        console.error("PostgreSQL uploaded_files saqlashda xatolik:", err);
      }
    }

    // Tezkor lokal kesh (git tomonidan ignore qilinadi)
    try {
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, sanitizedName);
      await fs.writeFile(filePath, buffer);
    } catch {
      // Ignore disk caching errors
    }

    return {
      url: `/uploads/${sanitizedName}`,
      storageKey: sanitizedName,
    };
  }
}

export async function getUploadedFile(
  filename: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const safeName = path.basename(decodeURIComponent(filename));
  const ext = path.extname(safeName).toLowerCase();
  const defaultType = MIME_TYPES[ext] || "application/octet-stream";

  // 1. Avval lokal disk keshini tekshiramiz
  try {
    const filePath = path.join(process.cwd(), "public", "uploads", safeName);
    const fileBuffer = await fs.readFile(filePath);
    return { buffer: fileBuffer, contentType: defaultType };
  } catch {
    // Diskda topilmadi, doimiy PostgreSQL bazasidan qidiramiz
  }

  // 2. PostgreSQL uploaded_files jadvalidan qidiramiz
  const sql = getPgClient();
  if (sql) {
    try {
      const rows = await sql`
        SELECT content_type, data 
        FROM uploaded_files 
        WHERE id = ${safeName} OR file_name = ${safeName} 
        LIMIT 1
      `;
      if (rows.length > 0) {
        const row = rows[0];
        const buffer = Buffer.from(row.data, "base64");

        // Keyingi so'rovlar tez bo'lishi uchun disk keshiga yozib qo'yamiz
        try {
          const uploadDir = path.join(process.cwd(), "public", "uploads");
          await fs.mkdir(uploadDir, { recursive: true });
          await fs.writeFile(path.join(uploadDir, safeName), buffer);
        } catch {
          // ignore cache write error
        }

        return {
          buffer,
          contentType: row.content_type || defaultType,
        };
      }
    } catch (err) {
      console.error("uploaded_files bazadan o'qishda xatolik:", err);
    }
  }

  return null;
}
