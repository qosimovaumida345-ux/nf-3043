import { NextResponse } from "next/server";
import { getDb, ensureDatabaseReady } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, createToken, AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    await ensureDatabaseReady();
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Login va parolni kiriting." },
        { status: 400 }
      );
    }

    const db = getDb();
    const foundUsers = await db
      .select()
      .from(users)
      .where(eq(users.username, username.trim().toLowerCase()))
      .limit(1);

    if (foundUsers.length === 0) {
      return NextResponse.json(
        { error: "Login yoki parol noto'g'ri." },
        { status: 401 }
      );
    }

    const user = foundUsers[0];

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Sizning hisobingiz faol emas. O'qituvchiga murojaat qiling." },
        { status: 403 }
      );
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Login yoki parol noto'g'ri." },
        { status: 401 }
      );
    }

    const token = await createToken({
      id: user.id,
      username: user.username,
      role: user.role as "ADMIN" | "STUDENT",
      fullName: user.fullName,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
      },
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);

    return response;
  } catch (error) {
    console.error("Login xatoligi:", error);
    return NextResponse.json(
      { error: "Tizimga kirishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring." },
      { status: 500 }
    );
  }
}
