import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const cookies = getSessionCookie(request, {
    cookiePrefix: "auth",
  });
  if (!cookies) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|auth|goodbye|_next/static|_next/image|favicon.ico).*)"],
  runtime: "nodejs",
};
