import { defaultClient as db } from "@repo/database/clients";
import { createApi } from "@repo/orpc/server";

const handler = createApi({ db });

export const HEAD = handler;
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
