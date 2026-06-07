import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "./server";

export const { GET, POST } = toNextJsHandler(auth.handler);
