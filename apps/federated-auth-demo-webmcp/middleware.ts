import { auth } from "./auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnProtectedRoute = req.nextUrl.pathname.startsWith("/my-audi");

  if (isOnProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  // If logged in and on home page, redirect to my-audi
  if (isLoggedIn && req.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/my-audi", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|favicon.ico|sitemap.xml|robots.txt|api|.*\\.jpg|.*\\.png|.*\\.svg|.*\\.gif).*)",
  ],
};
