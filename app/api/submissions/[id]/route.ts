import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb, ensureDatabaseReady } from "@/lib/db";
import { submissions, reviewComments, notifications } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan." }, { status: 401 });
    }

    const { id: submissionId } = await context.params;
    if (!submissionId) {
      return NextResponse.json({ error: "Topshiriq ID si ko'rsatilmadi." }, { status: 400 });
    }

    await ensureDatabaseReady();
    const db = getDb();

    // Topshiriqni tekshirish
    const existing = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, submissionId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Topshiriq topilmadi." }, { status: 404 });
    }

    const sub = existing[0];

    // Ruxsat tekshiruvi:
    // 1. ADMIN xohlagan topshiriqni o'chira oladi (to'g'ri deb belgilangan yoki tekshirilmagan)
    // 2. STUDENT faqat o'zining hali tekshirilmagan (PENDING) topshirig'ini o'chira oladi
    if (session.role === "STUDENT") {
      if (sub.studentId !== session.id) {
        return NextResponse.json({ error: "Faqat o'zingizning topshirig'ingizni o'chira olasiz." }, { status: 403 });
      }
      if (sub.status !== "PENDING") {
        return NextResponse.json(
          { error: "O'qituvchi tekshirib bo'lgan topshiriqni talaba o'chira olmaydi. Ustozga murojaat qiling." },
          { status: 400 }
        );
      }
    } else if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Ruxsat berilmadi." }, { status: 403 });
    }

    // 1. Bog'langan sharhlar va bildirishnomalarni o'chirish
    await db.delete(reviewComments).where(eq(reviewComments.submissionId, submissionId));
    await db.delete(notifications).where(eq(notifications.submissionId, submissionId));

    // 2. Topshiriqning o'zini o'chirish
    await db.delete(submissions).where(eq(submissions.id, submissionId));

    return NextResponse.json({
      success: true,
      message: "Topshiriq muvaffaqiyatli o'chirildi.",
      deletedId: submissionId,
      homeworkId: sub.homeworkId,
    });
  } catch (error) {
    console.error("Topshiriqni o'chirishda xatolik:", error);
    return NextResponse.json(
      { error: "Topshiriqni o'chirishda server xatoligi yuz berdi." },
      { status: 500 }
    );
  }
}
