import { type SQL, and, eq, exists, sql } from "drizzle-orm";
import { type AnyPgColumn, alias } from "drizzle-orm/pg-core";
import { dataset, member } from "@repo/database/schema";
import { authVoter } from "../../auth/voter";
import { type ProcedureContextInput, toProcedureContext } from "../../base";

const accessDataset = alias(dataset, "access_dataset");

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
