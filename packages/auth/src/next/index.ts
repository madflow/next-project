import { getSessionCookie } from "better-auth/cookies";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";
import type { RouteHandlerAuth } from "../server";
import { AUTH_COOKIE_PREFIX } from "../shared";

type CreateProtectedMiddlewareOptions = {
  cookiePrefix?: string;
  loginPath?: `/${string}`;
};

export function createAuthRouteHandlers(auth: RouteHandlerAuth) {
  return toNextJsHandler(auth.handler);
}

export function createProtectedMiddleware({
  cookiePrefix = AUTH_COOKIE_PREFIX,
  loginPath = "/auth/login",
}: CreateProtectedMiddlewareOptions = {}) {
  return function protectedMiddleware(request: NextRequest) {
    const cookies = getSessionCookie(request, {
      cookiePrefix,
    });

    if (!cookies) {
      return NextResponse.redirect(new URL(loginPath, request.url));
    }

    return NextResponse.next();
  };
}
