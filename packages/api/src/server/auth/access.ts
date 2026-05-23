import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
import { member } from "@repo/database/schema";
import type { Context } from "../context";
import { authVoter } from "./voter";

const permissionDeniedMessage = "You do not have enough permission to perform this action.";

function getAuthenticatedUserId(context: Pick<Context, "principal">) {
  if (context.principal.kind !== "anonymous") {
    return context.principal.user.id;
  }

  throw new ORPCError("UNAUTHORIZED", {
    message: "Missing user session. Please log in!",
    status: 401,
  });
}

function throwAccessDenied() {
  throw new ORPCError("FORBIDDEN", {
    message: permissionDeniedMessage,
    status: 403,
  });
}

export async function requireOrganizationMembership(
  context: Pick<Context, "db" | "principal">,
  organizationId: string
) {
  if (authVoter.canAccessAdminOperations(context.principal)) {
    return;
  }

  const userId = getAuthenticatedUserId(context);

  const rows = await context.db
    .select({ id: member.id })
    .from(member)
    .where(and(eq(member.organizationId, organizationId), eq(member.userId, userId)))
    .limit(1)
    .execute();

  if (rows.length === 0) {
    throwAccessDenied();
  }
}

export function requireMemberReadAccess(context: Pick<Context, "principal">, memberUserId: string) {
  if (authVoter.canAccessAdminOperations(context.principal)) {
    return;
  }

  const userId = getAuthenticatedUserId(context);
  if (userId === memberUserId) {
    return;
  }

  throwAccessDenied();
}
