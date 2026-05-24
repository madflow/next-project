import { ORPCError } from "@orpc/server";
import { type SQL, and, eq, exists, sql } from "drizzle-orm";
import { type AnyPgColumn, alias } from "drizzle-orm/pg-core";
import { dataset, member } from "@repo/database/schema";
import { authVoter } from "../../auth/voter";
import { type ProcedureContextInput, toProcedureContext } from "../../base";

const accessDataset = alias(dataset, "access_dataset");

function getAuthenticatedUserId(context: Pick<ReturnType<typeof toProcedureContext>, "principal">): string {
  if (context.principal.kind !== "anonymous") {
    return context.principal.user.id;
  }

  throw new ORPCError("UNAUTHORIZED", {
    message: "Missing user session. Please log in!",
    status: 401,
  });
}

function throwAccessDenied(): never {
  throw new ORPCError("FORBIDDEN", {
    message: "You do not have enough permission to perform this action.",
    status: 403,
  });
}

export function getDatasetRelatedAccessWhere(
  context: ProcedureContextInput,
  datasetIdColumn: AnyPgColumn
): SQL<unknown> | undefined {
  const procedureContext = toProcedureContext(context);

  if (authVoter.canAccessAdminOperations(procedureContext.principal)) {
    return undefined;
  }

  const { principal } = procedureContext;
  if (principal.kind === "anonymous") {
    return undefined;
  }

  const membershipSubquery = context.db
    .select({ one: sql`1` })
    .from(accessDataset)
    .innerJoin(member, eq(member.organizationId, accessDataset.organizationId))
    .where(and(eq(accessDataset.id, datasetIdColumn), eq(member.userId, principal.user.id)));

  return exists(membershipSubquery);
}

export async function requireDatasetAccess(context: ProcedureContextInput, datasetId: string) {
  const procedureContext = toProcedureContext(context);

  if (authVoter.canAccessAdminOperations(procedureContext.principal)) {
    return;
  }

  const userId = getAuthenticatedUserId(procedureContext);

  const datasetRows = await context.db
    .select({ organizationId: accessDataset.organizationId })
    .from(accessDataset)
    .where(eq(accessDataset.id, datasetId))
    .execute();

  const datasetRecord = datasetRows[0];

  const organizationId = datasetRecord?.organizationId;

  if (organizationId === undefined) {
    throwAccessDenied();
  }

  const membershipSubquery = context.db
    .select({ one: sql`1` })
    .from(member)
    .where(and(eq(member.organizationId, organizationId), eq(member.userId, userId)));

  const result = await context.db.execute(sql`select ${exists(membershipSubquery)} as "exists"`);
  const membershipExists = result.rows[0]?.exists;

  if (!membershipExists) {
    throwAccessDenied();
  }
}
