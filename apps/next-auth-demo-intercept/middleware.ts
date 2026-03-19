import { auth } from "./auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnProtectedRoute = req.nextUrl.pathname.startsWith("/chat");

  if (isOnProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  // If logged in and on home page, redirect to chat
  if (isLoggedIn && req.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/chat", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|favicon.ico|sitemap.xml|robots.txt|api|.*\\.jpg|.*\\.png|.*\\.svg|.*\\.gif).*)",
  ],
};
