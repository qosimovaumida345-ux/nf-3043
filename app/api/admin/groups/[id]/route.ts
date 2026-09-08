import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb, ensureDatabaseReady } from "@/lib/db";
import { groups } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Ruxsat berilmadi." }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Guruh nomini kiriting." }, { status: 400 });
    }

    const cleanName = name.trim();

    await ensureDatabaseReady();
    const db = getDb();

    // Nom boshqa guruh tomonidan band qilinmaganligini tekshirish
    const existing = await db
      .select()
      .from(groups)
      .where(and(eq(groups.name, cleanName), ne(groups.id, id)))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: "Bu nomdagi boshqa guruh allaqachon mavjud." }, { status: 409 });
    }

    await db
      .update(groups)
      .set({
        name: cleanName,
        description: description?.trim() || null,
      })
      .where(eq(groups.id, id));

    return NextResponse.json({ success: true, group: { id, name: cleanName, description } });
  } catch (error) {
    console.error("Guruhni tahrirlashda xatolik:", error);
    return NextResponse.json({ error: "Guruhni tahrirlashda xatolik yuz berdi." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Ruxsat berilmadi." }, { status: 403 });
    }

    const { id } = await context.params;

    await ensureDatabaseReady();
    const db = getDb();

    await db.delete(groups).where(eq(groups.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Guruhni o'chirishda xatolik:", error);
    return NextResponse.json({ error: "Guruhni o'chirishda xatolik yuz berdi." }, { status: 500 });
  }
}
