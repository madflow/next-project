import { createApi } from "@repo/api/server";
import { defaultClient as db } from "@repo/database/clients";
import { auth } from "@/lib/auth";

const handler = createApi({ auth, db, pathPrefix: "/api" });

export const HEAD = handler;
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
