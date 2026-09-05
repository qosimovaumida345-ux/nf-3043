import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb, ensureDatabaseReady } from "@/lib/db";
import { submissions, reviewComments, users, notifications } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { notificationEmitter } from "@/lib/events";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan." }, { status: 401 });
    }

    await ensureDatabaseReady();
    const db = getDb();

    // 1. TALABA OQIMI: Faqat o'z yuklamalari va unga yozilgan admin sharhlari (Mutlaq izolyatsiya)
    if (session.role === "STUDENT") {
      const studentSubmissions = await db
        .select({
          id: submissions.id,
          imageUrl: submissions.imageUrl,
          taskTitle: submissions.taskTitle,
          status: submissions.status,
          submittedAt: submissions.submittedAt,
          comment: {
            id: reviewComments.id,
            feedbackText: reviewComments.feedbackText,
            verdict: reviewComments.verdict,
            createdAt: reviewComments.createdAt,
          },
        })
        .from(submissions)
        .leftJoin(reviewComments, eq(submissions.id, reviewComments.submissionId))
        .where(eq(submissions.studentId, session.id))
        .orderBy(desc(submissions.submittedAt));

      return NextResponse.json({ submissions: studentSubmissions });
    }

    // 2. ADMIN OQIMI: Barcha talabalarning barcha yuklamalari
    if (session.role === "ADMIN") {
      const { searchParams } = new URL(request.url);
      const studentFilter = searchParams.get("studentId");
      const statusFilter = searchParams.get("status");

      let query = db
        .select({
          id: submissions.id,
          studentId: submissions.studentId,
          studentName: users.fullName,
          studentUsername: users.username,
          imageUrl: submissions.imageUrl,
          taskTitle: submissions.taskTitle,
          status: submissions.status,
          submittedAt: submissions.submittedAt,
          comment: {
            id: reviewComments.id,
            feedbackText: reviewComments.feedbackText,
            verdict: reviewComments.verdict,
            createdAt: reviewComments.createdAt,
          },
        })
        .from(submissions)
        .innerJoin(users, eq(submissions.studentId, users.id))
        .leftJoin(reviewComments, eq(submissions.id, reviewComments.submissionId))
        .orderBy(desc(submissions.submittedAt));

      const allSubmissions = await query;

      let filtered = allSubmissions;
      if (studentFilter) {
        filtered = filtered.filter((s) => s.studentId === studentFilter);
      }
      if (statusFilter && statusFilter !== "ALL") {
        filtered = filtered.filter((s) => s.status === statusFilter);
      }

      return NextResponse.json({ submissions: filtered });
    }

    return NextResponse.json({ error: "Noto'g'ri rol." }, { status: 403 });
  } catch (error) {
    console.error("Topshiriqlarni olishda xatolik:", error);
    return NextResponse.json({ error: "Topshiriqlarni yuklashda xatolik yuz berdi." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan." }, { status: 401 });
    }

    if (session.role !== "STUDENT") {
      return NextResponse.json({ error: "Faqat talabalar kod topshirishi mumkin." }, { status: 403 });
    }

    const body = await request.json();
    const { imageUrl, storageKey, taskTitle } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: "Rasm manzili majburiy." }, { status: 400 });
    }

    await ensureDatabaseReady();
    const db = getDb();

    const submissionId = "sub-" + Math.random().toString(36).substring(2, 12);
    const now = new Date();

    // Topshiriqni saqlash
    await db.insert(submissions).values({
      id: submissionId,
      studentId: session.id,
      imageUrl,
      storageKey: storageKey || null,
      taskTitle: taskTitle || "Kundalik kod topshirig'i",
      status: "PENDING",
      submittedAt: now,
    });

    // Admin uchun bildirishnoma yaratish
    const adminUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, "ADMIN"))
      .limit(1);

    if (adminUser.length > 0) {
      await db.insert(notifications).values({
        id: "notif-" + Math.random().toString(36).substring(2, 10),
        recipientId: adminUser[0].id,
        submissionId: submissionId,
        message: `${session.fullName} yangi kod topshirig'ini yukladi.`,
        isRead: false,
      });
    }

    // Real-vaqt SSE hodisasini tarqatish (O'qituvchi ekrani uchun)
    notificationEmitter.emit("new-submission", {
      submissionId,
      studentId: session.id,
      studentName: session.fullName,
      taskTitle: taskTitle || "Kundalik kod topshirig'i",
      submittedAt: now.toISOString(),
      imageUrl,
    });

    return NextResponse.json({
      success: true,
      submission: {
        id: submissionId,
        imageUrl,
        taskTitle,
        status: "PENDING",
        submittedAt: now.toISOString(),
      },
    });
  } catch (error) {
    console.error("Topshiriq yuklashda xatolik:", error);
    return NextResponse.json({ error: "Topshiriqni saqlashda xatolik yuz berdi." }, { status: 500 });
  }
}
