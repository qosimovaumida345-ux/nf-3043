import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs/promises";
import path from "path";

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
    // R2 kalitlari berilmagan bo'lsa, xavfsiz lokal omborga saqlash
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    
    const filePath = path.join(uploadDir, sanitizedName);
    await fs.writeFile(filePath, buffer);

    return {
      url: `/uploads/${sanitizedName}`,
      storageKey: sanitizedName,
    };
  }
}
