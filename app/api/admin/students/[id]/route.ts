import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb, ensureDatabaseReady } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

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
