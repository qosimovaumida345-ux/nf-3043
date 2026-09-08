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

// Baza jadvallarini avtomatik tekshirish va yaratish
export async function ensureDatabaseReady() {
  if (!connectionString) return;

  try {
    const sql = client || postgres(connectionString, {
      ssl: { rejectUnauthorized: false },
      max: 2,
    });

    // 1. groups jadvali
    await sql`
      CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    // 2. users jadvali
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

    // users jadvaliga group_id va initial_password qo'shish (agar mavjud bo'lmasa)
    try {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS group_id TEXT REFERENCES groups(id) ON DELETE SET NULL`;
    } catch (e) {
      console.warn("users.group_id migration notice:", e);
    }

    try {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS initial_password TEXT`;
    } catch (e) {
      console.warn("users.initial_password migration notice:", e);
    }

    // 3. homeworks jadvali (O'qituvchi ochadigan uy ishlari)
    await sql`
      CREATE TABLE IF NOT EXISTS homeworks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        sample_image_url TEXT,
        group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
        admin_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    // 4. submissions jadvali
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

    // submissions jadvaliga homework_id qo'shish (agar mavjud bo'lmasa)
    try {
      await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS homework_id TEXT REFERENCES homeworks(id) ON DELETE CASCADE`;
    } catch (e) {
      console.warn("submissions.homework_id migration notice:", e);
    }

    // 5. review_comments jadvali
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

    // 6. notifications jadvali
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

    // 7. group_messages jadvali (Guruh chatlari)
    await sql`
      CREATE TABLE IF NOT EXISTS group_messages (
        id TEXT PRIMARY KEY,
        group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    // 8. Barcha mavjud talabalarning parollarini admin ko'ra olishi uchun bo'sh bo'lgan initial_passwordlarni to'ldirish
    try {
      const nullPassUsers = await sql`SELECT id, username FROM users WHERE role = 'STUDENT' AND (initial_password IS NULL OR initial_password = '')`;
      for (const u of nullPassUsers) {
        const generatedPass = u.username + "123";
        const newHash = await bcrypt.hash(generatedPass, 10);
        await sql`UPDATE users SET initial_password = ${generatedPass}, password_hash = ${newHash} WHERE id = ${u.id}`;
      }
    } catch (passFillErr) {
      console.warn("initial_password to'ldirishda ogohlantirish:", passFillErr);
    }

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
