import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb, ensureDatabaseReady } from "@/lib/db";
import { submissions, reviewComments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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
    const { feedbackText, verdict } = body;

    if (!feedbackText || !verdict) {
      return NextResponse.json(
        { error: "Sharh matni va baho natijasini tanlang." },
        { status: 400 }
      );
    }

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
          feedbackText,
          verdict,
          updatedAt: now,
        })
        .where(eq(reviewComments.id, existingReview[0].id));
    } else {
      await db.insert(reviewComments).values({
        id: "rev-" + Math.random().toString(36).substring(2, 10),
        submissionId,
        adminId: session.id,
        feedbackText,
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

    return NextResponse.json({
      success: true,
      verdict,
      feedbackText,
      updatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("Sharh qoldirishda xatolik:", error);
    return NextResponse.json({ error: "Sharhni saqlashda xatolik yuz berdi." }, { status: 500 });
  }
}
