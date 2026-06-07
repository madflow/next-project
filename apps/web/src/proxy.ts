import { NextRequest } from "next/server";
import { middleware as authMiddleware } from "@repo/auth/web/middleware";

export async function proxy(request: NextRequest) {
  return authMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|rpc|auth|goodbye|_next/static|_next/image|favicon.ico).*)"],
};
