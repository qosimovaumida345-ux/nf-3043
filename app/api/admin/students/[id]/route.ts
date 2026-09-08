import { NextResponse } from "next/server";
import { getSession, hashPassword } from "@/lib/auth";
import { getDb, ensureDatabaseReady } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Ruxsat berilmadi." }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { username, fullName, groupId, isActive, password } = body;

    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ error: "To'liq ism kiritilishi shart." }, { status: 400 });
    }

    if (!username || !username.trim()) {
      return NextResponse.json({ error: "Login kiritilishi shart." }, { status: 400 });
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

    // Login boshqa user tomonidan band qilinmaganligini tekshirish
    const existing = await db
      .select()
      .from(users)
      .where(and(eq(users.username, cleanUsername), ne(users.id, id)))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Bu login boshqa foydalanuvchi tomonidan band." },
        { status: 409 }
      );
    }

    const updateData: Record<string, unknown> = {
      fullName: fullName.trim(),
      username: cleanUsername,
      groupId: groupId ? groupId : null,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    };

    if (password && password.trim()) {
      updateData.passwordHash = await hashPassword(password);
      updateData.initialPassword = password.trim();
    }

    await db
      .update(users)
      .set(updateData)
      .where(and(eq(users.id, id), eq(users.role, "STUDENT")));

    return NextResponse.json({
      success: true,
      student: {
        id,
        username: cleanUsername,
        fullName: fullName.trim(),
        groupId: groupId || null,
        initialPassword: password ? password.trim() : undefined,
      },
    });
  } catch (error) {
    console.error("Talabani tahrirlashda xatolik:", error);
    return NextResponse.json({ error: "Talabani tahrirlashda xatolik yuz berdi." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Ruxsat berilmadi." }, { status: 403 });
    }

    const { id } = await context.params;

    // Admin o'zini o'zi o'chirib tashlamasligi kerak
    if (session.id === id) {
      return NextResponse.json({ error: "Admin hisobini o'chirib bo'lmaydi." }, { status: 400 });
    }

    await ensureDatabaseReady();
    const db = getDb();

    // Faqat STUDENT rolidagi foydalanuvchini o'chirish
    await db.delete(users).where(and(eq(users.id, id), eq(users.role, "STUDENT")));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Talabani o'chirishda xatolik:", error);
    return NextResponse.json({ error: "Talabani o'chirishda xatolik yuz berdi." }, { status: 500 });
  }
}
