import { NextResponse } from "next/server";
import { getSession, hashPassword } from "@/lib/auth";
import { getDb, ensureDatabaseReady } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Ruxsat berilmadi." }, { status: 403 });
    }

    await ensureDatabaseReady();
    const db = getDb();

    const studentList = await db
      .select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.role, "STUDENT"))
      .orderBy(desc(users.createdAt));

    return NextResponse.json({ students: studentList });
  } catch (error) {
    console.error("Talabalar ro'yxatini olishda xatolik:", error);
    return NextResponse.json({ error: "Serverda xatolik yuz berdi." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Ruxsat berilmadi." }, { status: 403 });
    }

    const body = await request.json();
    const { username, fullName, password } = body;

    if (!username || !fullName || !password) {
      return NextResponse.json(
        { error: "Login, to'liq ism va parol to'ldirilishi shart." },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      return NextResponse.json(
        { error: "Login kamida 3 ta belgidan iborat bo'lishi kerak." },
        { status: 400 }
      );
    }

    await ensureDatabaseReady();
    const db = getDb();

    // Login bandligini tekshirish
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.username, cleanUsername))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Bu login allaqachon band. Boshqa login tanlang." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const newStudentId = "student-" + Math.random().toString(36).substring(2, 10);

    await db.insert(users).values({
      id: newStudentId,
      username: cleanUsername,
      passwordHash,
      role: "STUDENT",
      fullName: fullName.trim(),
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      student: {
        id: newStudentId,
        username: cleanUsername,
        fullName: fullName.trim(),
      },
    });
  } catch (error) {
    console.error("Talaba yaratishda xatolik:", error);
    return NextResponse.json({ error: "Talaba hisobini yaratishda xatolik yuz berdi." }, { status: 500 });
  }
}
