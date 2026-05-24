import { ORPCError } from "@orpc/server";
import { type SQL, and, eq, getTableColumns, notExists, sql } from "drizzle-orm";
import {
  type DatasetProject as DatasetProjectRecord,
  type Dataset as DatasetRecord,
  type DatasetSplitVariable as DatasetSplitVariableRecord,
  type DatasetVariable as DatasetVariableRecord,
  type DatasetVariableset as DatasetVariablesetRecord,
  type Organization,
  type Project as ProjectRecord,
  datasetProject as datasetProjectTable,
  datasetSplitVariable as datasetSplitVariableTable,
  dataset as datasetTable,
  datasetVariable as datasetVariableTable,
  datasetVariablesetContent,
  datasetVariableset as datasetVariablesetTable,
  organization,
  project,
} from "@repo/database/schema";
import { type CollectionInput, collectionInputSchema } from "../../../shared/contract/collection";
import { requireOrganizationMembership } from "../../auth/access";
import { type ProcedureContextInput, authenticatedApi, call, toProcedureContext } from "../../base";
import { getCollectionRow, listCollection } from "../../collection-query";
import { datasetProjectQueryDefinition } from "../dataset-project/query-definition";
import { datasetSplitVariableQueryDefinition } from "../dataset-split-variable/query-definition";
import { datasetVariableQueryDefinition } from "../dataset-variable/query-definition";
import { datasetVariablesetQueryDefinition } from "../dataset-variableset/query-definition";
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

type DatasetSplitVariablesInput = CollectionInput & {
  id: string;
};

type DatasetVariablesetsInput = CollectionInput & {
  hierarchical?: string;
  id: string;
};

type DatasetProjectListRow = DatasetProjectRecord & {
  dataset?: DatasetRecord;
  project?: ProjectRecord;
};

type DatasetSplitVariableListRow = DatasetSplitVariableRecord & {
  dataset?: DatasetRecord;
  variable?: DatasetVariableRecord;
};

type DatasetVariableListRow = DatasetVariableRecord & {
  dataset?: DatasetRecord;
};

type DatasetVariablesetListRow = DatasetVariablesetRecord & {
  dataset?: DatasetRecord;
  parent?: DatasetVariablesetRecord;
};

type VariablesetTreeNode = {
  attributes?: DatasetVariablesetRecord["attributes"];
  category: DatasetVariablesetRecord["category"];
  children: VariablesetTreeNode[];
  description?: DatasetVariablesetRecord["description"];
  id: string;
  level: number;
  name: string;
  orderIndex?: DatasetVariablesetRecord["orderIndex"];
  parentId?: DatasetVariablesetRecord["parentId"];
  variableCount: number;
};

type DatasetVariablesetHierarchyRow = {
  attributes?: DatasetVariablesetRecord["attributes"];
  category: DatasetVariablesetRecord["category"];
  description: DatasetVariablesetRecord["description"];
  id: string;
  name: string;
  orderIndex: DatasetVariablesetRecord["orderIndex"];
  parentId: DatasetVariablesetRecord["parentId"];
  variableCount: number | string;
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

export async function listDatasetAvailableSplitVariables(context: ProcedureContextInput, input: DatasetVariablesInput) {
  return call(variablesAvailableForSplitList, input, { context: toProcedureContext(context) });
}

export async function listDatasetProjects(context: ProcedureContextInput, input: DatasetProjectsInput) {
  return call(projectsList, input, { context: toProcedureContext(context) });
}

export async function listDatasetSplitVariables(context: ProcedureContextInput, input: DatasetSplitVariablesInput) {
  return call(splitVariablesList, input, { context: toProcedureContext(context) });
}

export async function listDatasetVariablesets(context: ProcedureContextInput, input: DatasetVariablesetsInput) {
  return call(variablesetsList, input, { context: toProcedureContext(context) });
}

function buildVariablesetHierarchy(rows: DatasetVariablesetHierarchyRow[]): VariablesetTreeNode[] {
  const nodeMap = new Map<string, VariablesetTreeNode>();
  const rootNodes: VariablesetTreeNode[] = [];

  for (const row of rows) {
    nodeMap.set(row.id, {
      attributes: row.attributes,
      category: row.category,
      children: [],
      description: row.description,
      id: row.id,
      level: 0,
      name: row.name,
      orderIndex: row.orderIndex,
      parentId: row.parentId,
      variableCount: Number(row.variableCount),
    });
  }

  for (const node of nodeMap.values()) {
    if (node.parentId) {
      const parent = nodeMap.get(node.parentId);
      if (parent) {
        node.level = parent.level + 1;
        parent.children.push(node);
        continue;
      }
    }

    rootNodes.push(node);
  }

  return rootNodes;
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

const variablesAvailableForSplitList = authenticatedDatasetApi.variables.availableForSplit.handler(
  async ({ context, input }) => {
    await requireDatasetAccess(context, input.id);
    const { id, ...collectionInput } = input;

    const assignedSplitVariableSubquery = context.db
      .select({ one: sql`1` })
      .from(datasetSplitVariableTable)
      .where(
        and(
          eq(datasetSplitVariableTable.datasetId, id),
          eq(datasetSplitVariableTable.variableId, datasetVariableTable.id)
        )
      );

    return listCollection<DatasetVariableListRow>({
      db: context.db,
      definition: datasetVariableQueryDefinition,
      embedSelections: {
        dataset: getTableColumns(datasetTable),
      },
      input: collectionInput,
      where: and(eq(datasetVariableTable.datasetId, id), notExists(assignedSplitVariableSubquery)),
    });
  }
);

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

const splitVariablesList = authenticatedDatasetApi.splitVariables.list.handler(async ({ context, input }) => {
  await requireDatasetAccess(context, input.id);
  const { id, ...collectionInput } = input;

  return listCollection<DatasetSplitVariableListRow>({
    db: context.db,
    definition: datasetSplitVariableQueryDefinition,
    embedSelections: {
      dataset: getTableColumns(datasetTable),
      variable: getTableColumns(datasetVariableTable),
    },
    input: collectionInput,
    where: eq(datasetSplitVariableTable.datasetId, id),
  });
});

const variablesetsList = authenticatedDatasetApi.variablesets.list.handler(async ({ context, input }) => {
  await requireDatasetAccess(context, input.id);
  const { id, hierarchical, ...collectionInput } = input;

  if (hierarchical === "true") {
    const rows = await context.db
      .select({
        attributes: datasetVariablesetTable.attributes,
        category: datasetVariablesetTable.category,
        description: datasetVariablesetTable.description,
        id: datasetVariablesetTable.id,
        name: datasetVariablesetTable.name,
        orderIndex: datasetVariablesetTable.orderIndex,
        parentId: datasetVariablesetTable.parentId,
        variableCount: sql<number>`CAST(COALESCE(COUNT(${datasetVariablesetContent.variableId}), 0) AS integer)`,
      })
      .from(datasetVariablesetTable)
      .leftJoin(
        datasetVariablesetContent,
        and(
          eq(datasetVariablesetTable.id, datasetVariablesetContent.variablesetId),
          eq(datasetVariablesetContent.contentType, "variable")
        )
      )
      .where(eq(datasetVariablesetTable.datasetId, id))
      .groupBy(
        datasetVariablesetTable.id,
        datasetVariablesetTable.name,
        datasetVariablesetTable.description,
        datasetVariablesetTable.parentId,
        datasetVariablesetTable.orderIndex,
        datasetVariablesetTable.category,
        datasetVariablesetTable.attributes
      )
      .orderBy(datasetVariablesetTable.orderIndex, datasetVariablesetTable.id)
      .execute();

    return {
      hierarchy: buildVariablesetHierarchy(rows),
    };
  }

  return listCollection<DatasetVariablesetListRow>({
    db: context.db,
    definition: datasetVariablesetQueryDefinition,
    embedSelections: {
      dataset: getTableColumns(datasetTable),
      parent: getTableColumns(datasetVariablesetTable),
    },
    input: {
      ...collectionInput,
      order: collectionInput.order ?? "orderIndex.asc,name.asc",
    },
    where: eq(datasetVariablesetTable.datasetId, id),
  });
});

export const dataset = {
  get,
  list,
  projects: {
    list: projectsList,
  },
  splitVariables: {
    list: splitVariablesList,
  },
  variablesets: {
    list: variablesetsList,
  },
  variables: {
    availableForSplit: variablesAvailableForSplitList,
    list: variablesList,
  },
};
