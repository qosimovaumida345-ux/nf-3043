import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getLiveModels, callOpenRouterWithFallback } from "@/lib/openrouter";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Ruxsat berilmadi." }, { status: 403 });
    }

    const { models, freeVisionModels, freeTextModels, visionCount, freeCount } = await getLiveModels();

    return NextResponse.json({
      success: true,
      totalModels: models.length,
      freeCount,
      visionCount,
      freeVisionModels,
      freeTextModels,
      allModels: models,
    });
  } catch (error: unknown) {
    console.error("OpenRouter models API error:", error);
    const msg = error instanceof Error ? error.message : "Modellarni olishda xatolik";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Ruxsat berilmadi." }, { status: 403 });
    }

    const body = await request.json();
    const { model, testVision } = body;

    const t0 = Date.now();
    let result = "";
    let modelUsed = "";

    if (testVision) {
      // 1x1 test image
      const testPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
      const resp = await callOpenRouterWithFallback({
        model: model || "inclusionai/ling-3.0-flash-vl:free",
        hasImages: true,
        maxTokens: 100,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Rasmda qanday rang bor? Qisqa javob ber." },
              { type: "image_url", image_url: { url: testPng } },
            ],
          },
        ],
      });
      result = resp.content;
      modelUsed = resp.modelUsed;
    } else {
      const resp = await callOpenRouterWithFallback({
        model: model || "inclusionai/ling-3.0-flash-sante:free",
        hasImages: false,
        maxTokens: 100,
        messages: [{ role: "user", content: "Salom! Mars IT School haqida 1 ta qisqa gap ayt." }],
      });
      result = resp.content;
      modelUsed = resp.modelUsed;
    }

    const duration = Date.now() - t0;

    return NextResponse.json({
      success: true,
      modelUsed,
      durationMs: duration,
      result,
    });
  } catch (error: unknown) {
    console.error("OpenRouter model test error:", error);
    const msg = error instanceof Error ? error.message : "Modelni sinashda xatolik";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
