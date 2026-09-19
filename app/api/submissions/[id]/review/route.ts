import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb, ensureDatabaseReady } from "@/lib/db";
import { submissions, reviewComments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Ruxsat berilmadi." }, { status: 403 });
    }

    const { id: submissionId } = await context.params;
    const body = await request.json();
    const { feedbackText, verdict, voiceUrl } = body;

    if (!verdict) {
      return NextResponse.json(
        { error: "Baho natijasini tanlang (To'g'ri, Xato yoki Qayta topshirish)." },
        { status: 400 }
      );
    }

    const cleanFeedback = feedbackText ? feedbackText.trim() : "";

    const validVerdicts = ["CORRECT", "INCORRECT", "RETRY"];
    if (!validVerdicts.includes(verdict)) {
      return NextResponse.json(
        { error: "Noto'g'ri baho formati." },
        { status: 400 }
      );
    }

    await ensureDatabaseReady();
    const db = getDb();

    // Topshiriq mavjudligini tekshirish
    const existing = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, submissionId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Topshiriq topilmadi." }, { status: 404 });
    }

    // Mavjud sharhni tekshirish
    const existingReview = await db
      .select()
      .from(reviewComments)
      .where(eq(reviewComments.submissionId, submissionId))
      .limit(1);

    const now = new Date();

    if (existingReview.length > 0) {
      await db
        .update(reviewComments)
        .set({
          feedbackText: cleanFeedback,
          voiceUrl: voiceUrl !== undefined ? voiceUrl : existingReview[0].voiceUrl,
          verdict,
          updatedAt: now,
        })
        .where(eq(reviewComments.id, existingReview[0].id));
    } else {
      await db.insert(reviewComments).values({
        id: "rev-" + Math.random().toString(36).substring(2, 10),
        submissionId,
        adminId: session.id,
        feedbackText: cleanFeedback,
        voiceUrl: voiceUrl || null,
        verdict,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Topshiriq statusini yangilash
    await db
      .update(submissions)
      .set({ status: verdict })
      .where(eq(submissions.id, submissionId));

    // Agar to'g'ri deb qabul qilinsa, ushbu talabaning ayni shu vazifasi bo'yicha boshqa barcha kutilayotgan (PENDING) urinishlari ham CORRECT qilinadi
    if (verdict === "CORRECT" && existing[0]) {
      const target = existing[0];
      if (target.homeworkId) {
        await db
          .update(submissions)
          .set({ status: "CORRECT" })
          .where(
            and(
              eq(submissions.studentId, target.studentId),
              eq(submissions.homeworkId, target.homeworkId),
              eq(submissions.status, "PENDING")
            )
          );
      } else if (target.taskTitle) {
        await db
          .update(submissions)
          .set({ status: "CORRECT" })
          .where(
            and(
              eq(submissions.studentId, target.studentId),
              eq(submissions.taskTitle, target.taskTitle),
              eq(submissions.status, "PENDING")
            )
          );
      }
    }

    return NextResponse.json({
      success: true,
      verdict,
      feedbackText: cleanFeedback,
      updatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("Sharh qoldirishda xatolik:", error);
    return NextResponse.json({ error: "Sharhni saqlashda xatolik yuz berdi." }, { status: 500 });
  }
}
