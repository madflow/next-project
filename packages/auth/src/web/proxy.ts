import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE_PREFIX = "auth";

export function proxy(request: NextRequest) {
  const cookies = getSessionCookie(request, {
    cookiePrefix: AUTH_COOKIE_PREFIX,
  });

  if (!cookies) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|rpc|auth|goodbye|_next/static|_next/image|favicon.ico).*)"],
};
