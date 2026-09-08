import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb, ensureDatabaseReady } from "@/lib/db";
import { groupMessages, users, groups } from "@/lib/db/schema";
import { eq, desc, asc } from "drizzle-orm";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan." }, { status: 401 });
    }

    const { id: groupId } = await context.params;

    await ensureDatabaseReady();
    const db = getDb();

    // Guruh mavjudligini tekshirish
    const groupData = await db
      .select()
      .from(groups)
      .where(eq(groups.id, groupId))
      .limit(1);

    if (groupData.length === 0) {
      return NextResponse.json({ error: "Guruh topilmadi." }, { status: 404 });
    }

    // Xabarlarni olish (oxirgi 100 ta xabar)
    const messages = await db
      .select({
        id: groupMessages.id,
        groupId: groupMessages.groupId,
        senderId: groupMessages.senderId,
        senderName: users.fullName,
        senderUsername: users.username,
        senderRole: users.role,
        message: groupMessages.message,
        createdAt: groupMessages.createdAt,
      })
      .from(groupMessages)
      .innerJoin(users, eq(groupMessages.senderId, users.id))
      .where(eq(groupMessages.groupId, groupId))
      .orderBy(asc(groupMessages.createdAt))
      .limit(100);

    return NextResponse.json({
      group: groupData[0],
      messages,
    });
  } catch (error) {
    console.error("Guruh xabarlarini olishda xatolik:", error);
    return NextResponse.json({ error: "Xabarlarni yuklab bo'lmadi." }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan." }, { status: 401 });
    }

    const { id: groupId } = await context.params;
    const body = await request.json();
    const { message, messageText } = body;
    const textToSend = (message || messageText || "").trim();

    if (!textToSend) {
      return NextResponse.json({ error: "Xabar matni bo'sh bo'lishi mumkin emas." }, { status: 400 });
    }

    await ensureDatabaseReady();
    const db = getDb();

    const newMsgId = "msg-" + Math.random().toString(36).substring(2, 11);

    await db.insert(groupMessages).values({
      id: newMsgId,
      groupId,
      senderId: session.id,
      message: textToSend,
    });

    return NextResponse.json({
      success: true,
      message: {
        id: newMsgId,
        groupId,
        senderId: session.id,
        senderName: session.fullName,
        senderUsername: session.username,
        senderRole: session.role,
        message: textToSend,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Guruh xabarini yuborishda xatolik:", error);
    return NextResponse.json({ error: "Xabar yuborishda xatolik yuz berdi." }, { status: 500 });
  }
}
