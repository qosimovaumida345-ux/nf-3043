import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb, ensureDatabaseReady } from "@/lib/db";
import { groups, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  try {
    await ensureDatabaseReady();
    const db = getDb();

    const userRecord = await db
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
        fullName: users.fullName,
        groupId: users.groupId,
        groupName: groups.name,
      })
      .from(users)
      .leftJoin(groups, eq(users.groupId, groups.id))
      .where(eq(users.id, session.id))
      .limit(1);

    if (userRecord.length > 0) {
      return NextResponse.json({ user: userRecord[0] });
    }
  } catch (err) {
    console.warn("auth/me database lookup warning:", err);
  }

  return NextResponse.json({ user: session });
}
