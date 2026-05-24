import { type SQL, and, eq, exists, getTableColumns, sql } from "drizzle-orm";
import {
  type Dataset as DatasetRecord,
  type Organization,
  dataset as datasetTable,
  member,
  organization,
} from "@repo/database/schema";
import { type CollectionInput, collectionInputSchema } from "../../../shared/contract/collection";
import { authVoter } from "../../auth/voter";
import { type ProcedureContextInput, authenticatedApi, call, toProcedureContext } from "../../base";
import { listCollection } from "../../collection-query";
import { datasetQueryDefinition } from "./query-definition";

const authenticatedDatasetApi = authenticatedApi.dataset;

type DatasetListRow = DatasetRecord & {
  organization?: Organization;
};

function getDatasetAccessWhere(context: ProcedureContextInput): SQL<unknown> | undefined {
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
    .from(member)
    .where(and(eq(member.userId, principal.user.id), eq(member.organizationId, datasetTable.organizationId)));

  return exists(membershipSubquery);
}

export async function listDatasets(context: ProcedureContextInput, input: CollectionInput) {
  return call(list, collectionInputSchema.parse(input), { context: toProcedureContext(context) });
}

const list = authenticatedDatasetApi.list.handler(async ({ context, input }) => {
  const accessWhere = getDatasetAccessWhere(context);

  return listCollection<DatasetListRow>({
    db: context.db,
    definition: datasetQueryDefinition,
    embedSelections: {
      organization: getTableColumns(organization),
    },
    input,
    where: accessWhere,
  });
});

export const dataset = {
  list,
};
