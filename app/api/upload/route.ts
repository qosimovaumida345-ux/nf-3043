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

    // Barcha rasm formatlarini tekshirish (MIME type yoki kengaytma orqali)
    const isImage =
      !file.type ||
      file.type.startsWith("image/") ||
      /\.(jpe?g|png|webp|heic|heif|gif|bmp|svg|avif|tiff|jfif|ico)$/i.test(file.name);

    if (!isImage) {
      return NextResponse.json(
        { error: "Faqat rasm formatidagi fayllar (PNG, JPG, JPEG, WEBP, HEIC, HEIF, BMP, GIF, AVIF, SVG) qabul qilinadi." },
        { status: 400 }
      );
    }

    // Maksimal hajm: 50MB (har qanday sifatli yoki yuqori aniqlikdagi telefon fotosuratlari to'siqsiz o'tishi uchun)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "Rasm hajmi 50MB dan oshmasligi kerak." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadImage(buffer, file.name, file.type || "image/jpeg");

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
