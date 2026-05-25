import type { Context } from "../../context";

export type RouteDefinition = {
  handler: (args: { context: Context; params: Record<string, string>; request: Request }) => Promise<Response>;
  method: string;
  pattern: string;
};
