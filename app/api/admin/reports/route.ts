import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb, ensureDatabaseReady } from "@/lib/db";
import { users, groups, submissions, homeworks, reviewComments } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Ruxsat berilmadi." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");

    await ensureDatabaseReady();
    const db = getDb();

    // Fetch students with their group
    const allStudents = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        username: users.username,
        groupId: users.groupId,
        groupName: groups.name,
      })
      .from(users)
      .leftJoin(groups, eq(users.groupId, groups.id))
      .where(eq(users.role, "STUDENT"));

    const filteredStudents = groupId && groupId !== "ALL"
      ? allStudents.filter((s) => s.groupId === groupId)
      : allStudents;

    // Fetch all submissions with review comments
    const allSubs = await db
      .select({
        id: submissions.id,
        studentId: submissions.studentId,
        homeworkId: submissions.homeworkId,
        taskTitle: submissions.taskTitle,
        status: submissions.status,
        submittedAt: submissions.submittedAt,
        homeworkTitle: homeworks.title,
        feedbackText: reviewComments.feedbackText,
        verdict: reviewComments.verdict,
      })
      .from(submissions)
      .leftJoin(homeworks, eq(submissions.homeworkId, homeworks.id))
      .leftJoin(reviewComments, eq(submissions.id, reviewComments.submissionId))
      .orderBy(desc(submissions.submittedAt));

    // Aggregate stats per student
    const studentStats = filteredStudents.map((st) => {
      const subs = allSubs.filter((s) => s.studentId === st.id);
      const totalSubmitted = subs.length;
      const correctCount = subs.filter((s) => s.status === "CORRECT").length;
      const incorrectCount = subs.filter((s) => s.status === "INCORRECT").length;
      const retryCount = subs.filter((s) => s.status === "RETRY").length;
      const pendingCount = subs.filter((s) => s.status === "PENDING").length;

      const completionRate = totalSubmitted > 0 ? Math.round((correctCount / totalSubmitted) * 100) : 0;

      return {
        fullName: st.fullName,
        username: st.username,
        groupName: st.groupName || "Guruhsiz",
        totalSubmitted,
        correctCount,
        incorrectCount,
        retryCount,
        pendingCount,
        completionRate: `${completionRate}%`,
      };
    });

    // Build CSV content
    const headers = [
      "O'quvchi F.I.Sh",
      "Login",
      "Guruh",
      "Jami topshirilgan",
      "To'g'ri (Qabul)",
      "Xato",
      "Qayta topshirish",
      "Kutilmoqda",
      "Muvaffaqiyat %",
    ];

    const rows = studentStats.map((st) => [
      `"${st.fullName.replace(/"/g, '""')}"`,
      `"${st.username}"`,
      `"${st.groupName}"`,
      st.totalSubmitted,
      st.correctCount,
      st.incorrectCount,
      st.retryCount,
      st.pendingCount,
      `"${st.completionRate}"`,
    ]);

    // UTF-8 BOM for Excel compatibility with Uzbek Cyrillic / Latin characters
    const bom = "\uFEFF";
    const csvContent = bom + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="mars-it-hisobot-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error: unknown) {
    console.error("Admin report export error:", error);
    const msg = error instanceof Error ? error.message : "Hisobotni yaratishda xatolik";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
