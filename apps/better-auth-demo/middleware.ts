import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ??
    request.cookies.get("__Secure-better-auth.session_token");
  const isLoggedIn = !!sessionCookie;
  const isOnProtectedRoute = request.nextUrl.pathname.startsWith("/chat");

  if (isOnProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }

  if (isLoggedIn && request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/chat", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|favicon.ico|sitemap.xml|robots.txt|api|.*\\.jpg|.*\\.png|.*\\.svg|.*\\.gif).*)",
  ],
};
