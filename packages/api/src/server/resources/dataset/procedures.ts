import { ORPCError } from "@orpc/server";
import { type SQL, eq, getTableColumns } from "drizzle-orm";
import {
  type DatasetProject as DatasetProjectRecord,
  type Dataset as DatasetRecord,
  type DatasetVariable as DatasetVariableRecord,
  type Organization,
  type Project as ProjectRecord,
  datasetProject as datasetProjectTable,
  dataset as datasetTable,
  datasetVariable as datasetVariableTable,
  organization,
  project,
} from "@repo/database/schema";
import { type CollectionInput, collectionInputSchema } from "../../../shared/contract/collection";
import { requireOrganizationMembership } from "../../auth/access";
import { type ProcedureContextInput, authenticatedApi, call, toProcedureContext } from "../../base";
import { getCollectionRow, listCollection } from "../../collection-query";
import { datasetProjectQueryDefinition } from "../dataset-project/query-definition";
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

type DatasetProjectsInput = CollectionInput & {
  id: string;
};

type DatasetProjectListRow = DatasetProjectRecord & {
  dataset?: DatasetRecord;
  project?: ProjectRecord;
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

export async function listDatasetProjects(context: ProcedureContextInput, input: DatasetProjectsInput) {
  return call(projectsList, input, { context: toProcedureContext(context) });
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

const projectsList = authenticatedDatasetApi.projects.list.handler(async ({ context, input }) => {
  await requireDatasetAccess(context, input.id);
  const { id, ...collectionInput } = input;

  return listCollection<DatasetProjectListRow>({
    db: context.db,
    definition: datasetProjectQueryDefinition,
    embedSelections: {
      dataset: getTableColumns(datasetTable),
      project: getTableColumns(project),
    },
    input: collectionInput,
    where: eq(datasetProjectTable.datasetId, id),
  });
});

export const dataset = {
  get,
  list,
  projects: {
    list: projectsList,
  },
  variables: {
    list: variablesList,
  },
};
