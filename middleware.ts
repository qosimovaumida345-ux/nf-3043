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
      const redirectUrl = user.role === "ADMIN" ? "/admin" : "/student";
      const res = NextResponse.redirect(new URL(redirectUrl, request.url));
      res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      return res;
    }
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return res;
  }

  // 2. /admin yo'llarini himoyalash
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      const res = NextResponse.redirect(loginUrl);
      res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      return res;
    }
    if (user.role !== "ADMIN") {
      // Talaba admin sahifasiga kirishga uringanda o'z paneliga qaytariladi
      const res = NextResponse.redirect(new URL("/student", request.url));
      res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      return res;
    }
  }

  // 3. /student yo'llarini himoyalash
  if (pathname.startsWith("/student")) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      const res = NextResponse.redirect(loginUrl);
      res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      return res;
    }
    if (user.role === "ADMIN") {
      // Admin talaba sahifasiga tushib qolmasligi uchun doim /admin ga yo'naltiriladi
      const res = NextResponse.redirect(new URL("/admin", request.url));
      res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      return res;
    }
  }

  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/student/:path*", "/login"],
};
