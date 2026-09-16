import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { reviewStudentCode } from "@/lib/openrouter";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Ruxsat berilmadi." }, { status: 403 });
    }

    const body = await request.json();
    const {
      imageUrls,
      codeSnippet,
      taskTitle,
      groupName,
      studentName,
      model,
    } = body;

    const hasImages = Array.isArray(imageUrls) && imageUrls.length > 0;
    const hasCode = typeof codeSnippet === "string" && codeSnippet.trim().length > 0;

    if (!hasImages && !hasCode) {
      return NextResponse.json(
        { error: "Tahlil qilish uchun kamida bitta rasm yoki kod matni kerak." },
        { status: 400 }
      );
    }

    const review = await reviewStudentCode({
      imageUrls: hasImages ? imageUrls : [],
      codeSnippet: hasCode ? codeSnippet : undefined,
      taskTitle,
      groupName,
      studentName,
      model,
    });

    return NextResponse.json({
      success: true,
      review,
    });
  } catch (error: unknown) {
    console.error("AI Review error:", error);
    const msg = error instanceof Error ? error.message : "AI tahlilda xatolik yuz berdi";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
