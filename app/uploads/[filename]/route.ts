import { getUploadedFile } from "@/lib/storage";

export async function GET(
  request: Request,
  context: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await context.params;
    const fileData = await getUploadedFile(filename);

    if (!fileData) {
      return new Response("Rasm topilmadi", { status: 404 });
    }

    return new Response(fileData.buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": fileData.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("Rasm uzatishda xatolik:", err);
    return new Response("Rasm topilmadi", { status: 404 });
  }
}
