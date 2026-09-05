import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb, ensureDatabaseReady } from "@/lib/db";
import { groups, users } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Ruxsat berilmadi." }, { status: 403 });
    }

    await ensureDatabaseReady();
    const db = getDb();

    // Guruhlar va ulardagi talabalar sonini olish
    const groupList = await db
      .select({
        id: groups.id,
        name: groups.name,
        description: groups.description,
        createdAt: groups.createdAt,
        studentCount: sql<number>`count(${users.id})::int`,
      })
      .from(groups)
      .leftJoin(users, eq(groups.id, users.groupId))
      .groupBy(groups.id)
      .orderBy(desc(groups.createdAt));

    return NextResponse.json({ groups: groupList });
  } catch (error) {
    console.error("Guruhlarni olishda xatolik:", error);
    return NextResponse.json({ error: "Guruhlarni yuklashda xatolik yuz berdi." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Ruxsat berilmadi." }, { status: 403 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Guruh nomini kiriting." }, { status: 400 });
    }

    const cleanName = name.trim();

    await ensureDatabaseReady();
    const db = getDb();

    const existing = await db
      .select()
      .from(groups)
      .where(eq(groups.name, cleanName))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: "Bu nomdagi guruh allaqachon mavjud." }, { status: 409 });
    }

    const groupId = "grp-" + Math.random().toString(36).substring(2, 10);

    await db.insert(groups).values({
      id: groupId,
      name: cleanName,
      description: description?.trim() || null,
    });

    return NextResponse.json({
      success: true,
      group: { id: groupId, name: cleanName, description },
    });
  } catch (error) {
    console.error("Guruh yaratishda xatolik:", error);
    return NextResponse.json({ error: "Guruh yaratishda xatolik yuz berdi." }, { status: 500 });
  }
}
