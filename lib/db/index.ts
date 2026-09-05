import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;

let client: postgres.Sql | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL muhit o'zgaruvchisi topilmadi. Iltimos, Render'dagi PostgreSQL ulanish manzilini .env yoki Render dashboard'ga kiriting."
    );
  }

  if (!client) {
    const isSsl = connectionString.includes("sslmode=require") || process.env.NODE_ENV === "production";
    
    client = postgres(connectionString, {
      ssl: isSsl ? { rejectUnauthorized: false } : false,
      max: 10,
      idle_timeout: 30,
      connect_timeout: 10,
    });
    
    dbInstance = drizzle(client, { schema });
  }

  return dbInstance!;
}

// Baza jadvallarini avtomatik tekshirish va yaratish (Render'da alohida migratsiya yurgizmaslik uchun)
export async function ensureDatabaseReady() {
  if (!connectionString) return;

  try {
    const sql = client || postgres(connectionString, {
      ssl: { rejectUnauthorized: false },
      max: 2,
    });

    // 1. users jadvali
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'STUDENT',
        full_name VARCHAR(150) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    // 2. submissions jadvali
    await sql`
      CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        storage_key TEXT,
        task_title TEXT DEFAULT 'Kundalik kod topshirig''i',
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    // 3. review_comments jadvali
    await sql`
      CREATE TABLE IF NOT EXISTS review_comments (
        id TEXT PRIMARY KEY,
        submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
        admin_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        feedback_text TEXT NOT NULL,
        verdict VARCHAR(20) NOT NULL DEFAULT 'CORRECT',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    // 4. notifications jadvali
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        recipient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        submission_id TEXT REFERENCES submissions(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    // Boshlang'ich Admin mavjudligini tekshirish va yaratish
    const adminCheck = await sql`SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1`;
    if (adminCheck.length === 0) {
      const defaultAdminPassword = process.env.ADMIN_INITIAL_PASSWORD || "admin123";
      const hashedPassword = await bcrypt.hash(defaultAdminPassword, 10);
      const adminId = "admin-" + Math.random().toString(36).substring(2, 10);

      await sql`
        INSERT INTO users (id, username, password_hash, role, full_name, is_active)
        VALUES (
          ${adminId}, 
          'admin', 
          ${hashedPassword}, 
          'ADMIN', 
          'Mars IT O''qituvchi', 
          true
        )
        ON CONFLICT (username) DO NOTHING;
      `;
      console.log("✅ Boshlang'ich Admin hisobi yaratildi (login: admin, parol:", defaultAdminPassword, ")");
    }
  } catch (error) {
    console.error("Ma'lumotlar bazasi initsializatsiyasida xatolik:", error);
  }
}

export const db = connectionString ? getDb() : (null as unknown as ReturnType<typeof drizzle<typeof schema>>);
