import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { extractCodeFromImage } from "@/lib/openrouter";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Ruxsat berilmadi." }, { status: 403 });
    }

    const body = await request.json();
    const { imageUrls, model } = body;

    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      return NextResponse.json(
        { error: "Kodni ajratish uchun kamida bitta rasm talab qilinadi." },
        { status: 400 }
      );
    }

    const result = await extractCodeFromImage({
      imageUrls,
      model,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: unknown) {
    console.error("AI OCR error:", error);
    const msg = error instanceof Error ? error.message : "Kodni ajratishda xatolik";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
