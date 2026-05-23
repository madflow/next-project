import { ORPCError } from "@orpc/server";
import type { Context } from "../context";
import { authVoter } from "./voter";

export function requireAuthenticated(context: Pick<Context, "principal">) {
  if (authVoter.canAccessAuthenticatedRoute(context.principal)) {
    return;
  }

  throw new ORPCError("UNAUTHORIZED", {
    message: "Missing user session. Please log in!",
    status: 401,
  });
}

export function requireAdmin(context: Pick<Context, "principal">) {
  if (!authVoter.canAccessAuthenticatedRoute(context.principal)) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "Missing user session. Please log in!",
      status: 401,
    });
  }

  if (authVoter.canAccessAdminOperations(context.principal)) {
    return;
  }

  throw new ORPCError("FORBIDDEN", {
    message: "You do not have enough permission to perform this action.",
    status: 403,
  });
}
