import { createApi } from "@repo/api/server";
import { auth } from "@repo/auth/nextjs/server";
import { defaultClient as db } from "@repo/database/clients";

const handler = createApi({ auth, db, pathPrefix: "/api" });

export const dynamic = "force-dynamic";

export const HEAD = handler;
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
