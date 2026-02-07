import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for session token cookie (NextAuth JWT strategy)
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  const isLoggedIn = !!sessionToken;

  // Protected routes
  const isProtected =
    pathname.startsWith("/calendar") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/admin");

  // Auth pages (login/signup) — redirect logged-in users to calendar
  const isAuthPage = pathname === "/" || pathname === "/login" || pathname === "/signup";

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && isLoggedIn) {
    const calendarUrl = new URL("/calendar", request.url);
    return NextResponse.redirect(calendarUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/calendar/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/login",
    "/signup",
  ],
};
