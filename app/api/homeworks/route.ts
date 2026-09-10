import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb, ensureDatabaseReady } from "@/lib/db";
import { homeworks, groups, users, submissions, reviewComments } from "@/lib/db/schema";
import { desc, eq, or, isNull } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan." }, { status: 401 });
    }

    await ensureDatabaseReady();
    const db = getDb();

    // 1. ADMIN UCHUN: Barcha yaratilgan uy ishlari
    if (session.role === "ADMIN") {
      const allHomeworks = await db
        .select({
          id: homeworks.id,
          title: homeworks.title,
          description: homeworks.description,
          sampleImageUrl: homeworks.sampleImageUrl,
          groupId: homeworks.groupId,
          groupName: groups.name,
          deadline: homeworks.deadline,
          isActive: homeworks.isActive,
          createdAt: homeworks.createdAt,
        })
        .from(homeworks)
        .leftJoin(groups, eq(homeworks.groupId, groups.id))
        .orderBy(desc(homeworks.createdAt));

      // Har bir uy ishi uchun topshiriqlar sonini hisoblash
      const allSubs = await db
        .select({
          homeworkId: submissions.homeworkId,
          status: submissions.status,
        })
        .from(submissions);

      const homeworksWithStats = allHomeworks.map((hw) => {
        const subsForHw = allSubs.filter((s) => s.homeworkId === hw.id);
        return {
          ...hw,
          totalSubmissions: subsForHw.length,
          pendingSubmissions: subsForHw.filter((s) => s.status === "PENDING").length,
          correctSubmissions: subsForHw.filter((s) => s.status === "CORRECT").length,
        };
      });

      return NextResponse.json({ homeworks: homeworksWithStats });
    }

    // 2. TALABA UCHUN: Faqat o'zining guruhiga (yoki barcha guruhlarga) tegishli uy ishlari
    if (session.role === "STUDENT") {
      const studentUser = await db
        .select({ groupId: users.groupId })
        .from(users)
        .where(eq(users.id, session.id))
        .limit(1);

      const studentGroupId = studentUser[0]?.groupId;

      // Talabaning guruhi yoki umumiy uy ishlari
      const studentHomeworks = await db
        .select({
          id: homeworks.id,
          title: homeworks.title,
          description: homeworks.description,
          sampleImageUrl: homeworks.sampleImageUrl,
          groupId: homeworks.groupId,
          groupName: groups.name,
          deadline: homeworks.deadline,
          createdAt: homeworks.createdAt,
        })
        .from(homeworks)
        .leftJoin(groups, eq(homeworks.groupId, groups.id))
        .where(
          studentGroupId
            ? or(isNull(homeworks.groupId), eq(homeworks.groupId, studentGroupId))
            : isNull(homeworks.groupId)
        )
        .orderBy(desc(homeworks.createdAt));

      // Talabaning har bir uy ishi bo'yicha shaxsiy topshirig'i
      const studentSubmissions = await db
        .select({
          id: submissions.id,
          homeworkId: submissions.homeworkId,
          imageUrl: submissions.imageUrl,
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
        .where(eq(submissions.studentId, session.id));

      const enrichedHomeworks = studentHomeworks.map((hw) => {
        const sub = studentSubmissions.find((s) => s.homeworkId === hw.id);

        return {
          ...hw,
          mySubmission: sub || null,
          // Agar topshirilmagan bo'lsa yoki ustoz qayta/xato deb belgilagan bo'lsa, qayta yuklash mumkin
          canSubmit: !sub || sub.status === "RETRY" || sub.status === "INCORRECT",
          isPending: sub?.status === "PENDING",
          isCorrect: sub?.status === "CORRECT",
        };
      });

      return NextResponse.json({ homeworks: enrichedHomeworks });
    }

    return NextResponse.json({ error: "Noto'g'ri rol." }, { status: 403 });
  } catch (error) {
    console.error("Uy ishlarini olishda xatolik:", error);
    return NextResponse.json({ error: "Uy ishlarini yuklashda xatolik yuz berdi." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Ruxsat berilmadi." }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, sampleImageUrl, groupId, deadline } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Uy ishi mavzu sarlavhasini kiritish shart." },
        { status: 400 }
      );
    }

    await ensureDatabaseReady();
    const db = getDb();

    const homeworkId = "hw-" + Math.random().toString(36).substring(2, 10);
    const parsedDeadline = deadline ? new Date(deadline) : null;

    await db.insert(homeworks).values({
      id: homeworkId,
      title: title.trim(),
      description: description ? description.trim() : "",
      sampleImageUrl: sampleImageUrl || null,
      groupId: groupId || null, // null bo'lsa barcha guruhlar uchun
      adminId: session.id,
      deadline: parsedDeadline && !isNaN(parsedDeadline.getTime()) ? parsedDeadline : null,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      homework: {
        id: homeworkId,
        title: title.trim(),
        description: description ? description.trim() : "",
        sampleImageUrl,
        groupId,
        deadline: parsedDeadline,
      },
    });
  } catch (error) {
    console.error("Uy ishi yaratishda xatolik:", error);
    return NextResponse.json({ error: "Uy ishi yaratishda xatolik yuz berdi." }, { status: 500 });
  }
}
