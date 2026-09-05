import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb, ensureDatabaseReady } from "@/lib/db";
import { groups } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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
