import { createAuthRouteHandlers } from "@repo/auth/next";
import { auth } from "./server";

export const { GET, POST } = createAuthRouteHandlers(auth);
