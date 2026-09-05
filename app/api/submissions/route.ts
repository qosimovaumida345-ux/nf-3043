import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb, ensureDatabaseReady } from "@/lib/db";
import { submissions, reviewComments, users, notifications, homeworks, groups } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { notificationEmitter } from "@/lib/events";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan." }, { status: 401 });
    }

    await ensureDatabaseReady();
    const db = getDb();

    // 1. TALABA OQIMI: Faqat o'z yuklamalari va unga yozilgan admin sharhlari
    if (session.role === "STUDENT") {
      const studentSubmissions = await db
        .select({
          id: submissions.id,
          homeworkId: submissions.homeworkId,
          homeworkTitle: homeworks.title,
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
        .leftJoin(homeworks, eq(submissions.homeworkId, homeworks.id))
        .leftJoin(reviewComments, eq(submissions.id, reviewComments.submissionId))
        .where(eq(submissions.studentId, session.id))
        .orderBy(desc(submissions.submittedAt));

      return NextResponse.json({ submissions: studentSubmissions });
    }

    // 2. ADMIN OQIMI: Barcha talabalarning barcha yuklamalari
    if (session.role === "ADMIN") {
      const { searchParams } = new URL(request.url);
      const studentFilter = searchParams.get("studentId");
      const groupFilter = searchParams.get("groupId");
      const statusFilter = searchParams.get("status");

      let query = db
        .select({
          id: submissions.id,
          homeworkId: submissions.homeworkId,
          homeworkTitle: homeworks.title,
          studentId: submissions.studentId,
          studentName: users.fullName,
          studentUsername: users.username,
          studentGroupId: users.groupId,
          studentGroupName: groups.name,
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
        .leftJoin(groups, eq(users.groupId, groups.id))
        .leftJoin(homeworks, eq(submissions.homeworkId, homeworks.id))
        .leftJoin(reviewComments, eq(submissions.id, reviewComments.submissionId))
        .orderBy(desc(submissions.submittedAt));

      const allSubmissions = await query;

      let filtered = allSubmissions;
      if (studentFilter && studentFilter !== "ALL") {
        filtered = filtered.filter((s) => s.studentId === studentFilter);
      }
      if (groupFilter && groupFilter !== "ALL") {
        filtered = filtered.filter((s) => s.studentGroupId === groupFilter);
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
    const { homeworkId, imageUrl, storageKey, taskTitle } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: "Rasm manzili majburiy." }, { status: 400 });
    }

    await ensureDatabaseReady();
    const db = getDb();

    // Agar aniq Uy ishi (Homework) bo'yicha topshirilayotgan bo'lsa:
    if (homeworkId) {
      const existing = await db
        .select()
        .from(submissions)
        .where(
          and(
            eq(submissions.studentId, session.id),
            eq(submissions.homeworkId, homeworkId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        const prev = existing[0];

        // 1. Agar hali tekshirilmagan (PENDING) bo'lsa - qayta yuborishni bloklaymiz!
        if (prev.status === "PENDING") {
          return NextResponse.json(
            {
              error:
                "Siz ushbu uy ishini allaqachon topshirgansiz. O'qituvchi tekshirib natijani e'lon qilmaguncha qayta yubora olmaysiz!",
            },
            { status: 400 }
          );
        }

        // 2. Agar To'g'ri deb qabul qilingan bo'lsa
        if (prev.status === "CORRECT") {
          return NextResponse.json(
            { error: "Ushbu uy ishi to'g'ri deb qabul qilingan. Uni qayta topshirish shart emas." },
            { status: 400 }
          );
        }

        // 3. Agar ustoz RETRY yoki INCORRECT deb belgilagan bo'lsa - yangi rasm bilan yangilashga ruxsat
        const now = new Date();
        await db
          .update(submissions)
          .set({
            imageUrl,
            storageKey: storageKey || null,
            taskTitle: taskTitle || prev.taskTitle,
            status: "PENDING",
            submittedAt: now,
          })
          .where(eq(submissions.id, prev.id));

        // Real-vaqt SSE hodisasini tarqatish
        notificationEmitter.emit("new-submission", {
          submissionId: prev.id,
          studentId: session.id,
          studentName: session.fullName,
          taskTitle: taskTitle || prev.taskTitle || "Uy ishi (Qayta topshirildi)",
          submittedAt: now.toISOString(),
          imageUrl,
        });

        return NextResponse.json({
          success: true,
          submission: {
            id: prev.id,
            imageUrl,
            taskTitle: taskTitle || prev.taskTitle,
            status: "PENDING",
            submittedAt: now.toISOString(),
          },
        });
      }
    }

    const submissionId = "sub-" + Math.random().toString(36).substring(2, 12);
    const now = new Date();

    // Yangi topshiriqni saqlash
    await db.insert(submissions).values({
      id: submissionId,
      studentId: session.id,
      homeworkId: homeworkId || null,
      imageUrl,
      storageKey: storageKey || null,
      taskTitle: taskTitle || "Uy ishi topshirig'i",
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
        message: `${session.fullName} yangi uy ishini topshirdi.`,
        isRead: false,
      });
    }

    // Real-vaqt SSE hodisasini tarqatish
    notificationEmitter.emit("new-submission", {
      submissionId,
      studentId: session.id,
      studentName: session.fullName,
      taskTitle: taskTitle || "Uy ishi topshirig'i",
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
