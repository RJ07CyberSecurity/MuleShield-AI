import { NextRequest, NextResponse } from "next/server";

// Routes that do NOT require authentication
const PUBLIC_ROUTES = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/locked",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow all public routes
  const isPublic =
    pathname === "/" ||
    PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  if (isPublic) {
    return NextResponse.next();
  }

  // Check for auth token in cookies (we'll mirror it from localStorage via a login action)
  const token =
    request.cookies.get("muleshield_token")?.value ||
    request.headers.get("Authorization")?.replace("Bearer ", "");

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT for:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
