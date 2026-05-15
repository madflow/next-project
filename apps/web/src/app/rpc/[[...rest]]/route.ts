import { createRPCHandler } from "@repo/orpc/server";

const handler = createRPCHandler();

export const HEAD = handler;
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
