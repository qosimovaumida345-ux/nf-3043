import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { uploadImage } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Fayl tanlanmadi." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Faqat rasm fayllari (JPEG, PNG, WEBP) qabul qilinadi." }, { status: 400 });
    }

    // Maksimal hajm: 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Rasm hajmi 10MB dan oshmasligi kerak." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadImage(buffer, file.name, file.type);

    return NextResponse.json({
      success: true,
      url: result.url,
      storageKey: result.storageKey,
    });
  } catch (error) {
    console.error("Rasm yuklashda xatolik:", error);
    return NextResponse.json({ error: "Rasm yuklashda xatolik yuz berdi." }, { status: 500 });
  }
}
