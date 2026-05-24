import { ORPCError } from "@orpc/server";
import { type SQL, eq, getTableColumns } from "drizzle-orm";
import {
  type Dataset as DatasetRecord,
  type DatasetVariable as DatasetVariableRecord,
  type Organization,
  dataset as datasetTable,
  datasetVariable as datasetVariableTable,
  organization,
} from "@repo/database/schema";
import { type CollectionInput, collectionInputSchema } from "../../../shared/contract/collection";
import { requireOrganizationMembership } from "../../auth/access";
import { type ProcedureContextInput, authenticatedApi, call, toProcedureContext } from "../../base";
import { getCollectionRow, listCollection } from "../../collection-query";
import { datasetVariableQueryDefinition } from "../dataset-variable/query-definition";
import { getDatasetRelatedAccessWhere, requireDatasetAccess } from "./access";
import { datasetQueryDefinition } from "./query-definition";

const authenticatedDatasetApi = authenticatedApi.dataset;

type DatasetListRow = DatasetRecord & {
  organization?: Organization;
};

type DatasetVariablesInput = CollectionInput & {
  id: string;
};

type DatasetVariableListRow = DatasetVariableRecord & {
  dataset?: DatasetRecord;
};

function getDatasetAccessWhere(context: ProcedureContextInput): SQL<unknown> | undefined {
  return getDatasetRelatedAccessWhere(context, datasetTable.id);
}

export async function listDatasets(context: ProcedureContextInput, input: CollectionInput) {
  return call(list, collectionInputSchema.parse(input), { context: toProcedureContext(context) });
}

export async function getDataset(context: ProcedureContextInput, input: { embed?: string; id: string }) {
  return call(get, input, { context: toProcedureContext(context) });
}

export async function listDatasetVariables(context: ProcedureContextInput, input: DatasetVariablesInput) {
  return call(variablesList, input, { context: toProcedureContext(context) });
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

const get = authenticatedDatasetApi.get.handler(async ({ context, input }) => {
  const dataset = await getCollectionRow<DatasetListRow>({
    db: context.db,
    definition: datasetQueryDefinition,
    embedSelections: {
      organization: getTableColumns(organization),
    },
    input,
    where: eq(datasetTable.id, input.id),
  });

  if (dataset === undefined) {
    throw new ORPCError("NOT_FOUND", {
      message: "Dataset not found",
      status: 404,
    });
  }

  await requireOrganizationMembership(context, dataset.organizationId);

  return dataset;
});

const variablesList = authenticatedDatasetApi.variables.list.handler(async ({ context, input }) => {
  await requireDatasetAccess(context, input.id);
  const { id, ...collectionInput } = input;

  return listCollection<DatasetVariableListRow>({
    db: context.db,
    definition: datasetVariableQueryDefinition,
    embedSelections: {
      dataset: getTableColumns(datasetTable),
    },
    input: collectionInput,
    where: eq(datasetVariableTable.datasetId, id),
  });
});

export const dataset = {
  get,
  list,
  variables: {
    list: variablesList,
  },
};
