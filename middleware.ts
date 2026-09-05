import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "mars-it-platform-super-secret-jwt-key-3043-secure";
const key = new TextEncoder().encode(JWT_SECRET);

interface UserPayload {
  id: string;
  username: string;
  role: "ADMIN" | "STUDENT";
  fullName: string;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth_token")?.value;

  let user: UserPayload | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, key);
      user = payload as unknown as UserPayload;
    } catch {
      user = null;
    }
  }

  // 1. Agar login sahifasiga kirgan bo'lsa va allaqachon avtorizatsiyadan o'tgan bo'lsa
  if (pathname === "/login") {
    if (user) {
      if (user.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", request.url));
      } else {
        return NextResponse.redirect(new URL("/student", request.url));
      }
    }
    return NextResponse.next();
  }

  // 2. /admin yo'llarini himoyalash
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (user.role !== "ADMIN") {
      // Talaba admin sahifasiga kirishga uringanda o'z paneliga qaytariladi
      return NextResponse.redirect(new URL("/student", request.url));
    }
  }

  // 3. /student yo'llarini himoyalash
  if (pathname.startsWith("/student")) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/student/:path*", "/login"],
};
