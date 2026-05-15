import { ORPCError } from "@orpc/server";
import { and, eq, getTableColumns, ilike, isNull, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import {
  type DatasetVariable as DatasetVariableRecord,
  datasetVariable as datasetVariableTable,
  datasetVariablesetContent,
  datasetVariableset as datasetVariablesetTable,
} from "@repo/database/schema";
import { type ProcedureContextInput, authenticatedApi, call, toProcedureContext } from "../../base";
import { requireDatasetAccess } from "../dataset/access";

const authenticatedVariablesetApi = authenticatedApi.variableset;
const subsetVariablesetTable = alias(datasetVariablesetTable, "subset_dataset_variableset");

type VariablesetVariableRow = DatasetVariableRecord & {
  attributes?: typeof datasetVariablesetContent.$inferSelect.attributes | null;
  orderIndex?: number;
};

type DatasetVariablesetVariablesInput = {
  id: string;
  limit?: number | string;
  offset?: number | string;
  search?: string;
  setId: string;
  unassigned?: string;
};

function notFoundError(message: string) {
  return new ORPCError("NOT_FOUND", {
    message,
    status: 404,
  });
}

function normalizeSearch(search?: string) {
  const trimmedSearch = search?.trim();
  return trimmedSearch ? trimmedSearch : undefined;
}

function paginateRows<T>(rows: T[], limit: number, offset: number) {
  return {
    count: rows.length,
    limit,
    offset,
    rows: rows.slice(offset, offset + limit),
  };
}

async function getVariablesetRecord(context: ProcedureContextInput, id: string) {
  const [variableset] = await context.db
    .select({
      datasetId: datasetVariablesetTable.datasetId,
      id: datasetVariablesetTable.id,
    })
    .from(datasetVariablesetTable)
    .where(eq(datasetVariablesetTable.id, id))
    .limit(1)
    .execute();

  if (variableset === undefined) {
    throw notFoundError("Variableset not found");
  }

  return variableset;
}

async function getVariablesInSet(
  context: ProcedureContextInput,
  variablesetId: string,
  options: {
    limit: number;
    offset: number;
    search?: string;
  }
) {
  const search = normalizeSearch(options.search);
  const whereConditions = [
    eq(datasetVariablesetContent.variablesetId, variablesetId),
    eq(datasetVariablesetContent.contentType, "variable"),
  ];

  if (search) {
    const searchCondition = or(
      ilike(datasetVariableTable.name, `%${search}%`),
      ilike(datasetVariableTable.label, `%${search}%`)
    );

    if (searchCondition) {
      whereConditions.push(searchCondition);
    }
  }

  const whereCondition = whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions);
  const rows = await context.db
    .select({
      ...getTableColumns(datasetVariableTable),
      attributes: datasetVariablesetContent.attributes,
      orderIndex: datasetVariablesetContent.position,
    })
    .from(datasetVariableTable)
    .innerJoin(
      datasetVariablesetContent,
      and(
        eq(datasetVariableTable.id, datasetVariablesetContent.variableId),
        eq(datasetVariablesetContent.contentType, "variable")
      )
    )
    .where(whereCondition)
    .orderBy(datasetVariablesetContent.position, datasetVariableTable.name)
    .execute();

  return paginateRows(rows as VariablesetVariableRow[], options.limit, options.offset);
}

async function getUnassignedVariables(
  context: ProcedureContextInput,
  datasetId: string,
  options: {
    limit: number;
    offset: number;
    search?: string;
  }
) {
  const search = normalizeSearch(options.search);
  const whereConditions = [eq(datasetVariableTable.datasetId, datasetId), isNull(datasetVariablesetContent.variableId)];

  if (search) {
    const searchCondition = or(
      ilike(datasetVariableTable.name, `%${search}%`),
      ilike(datasetVariableTable.label, `%${search}%`)
    );

    if (searchCondition) {
      whereConditions.push(searchCondition);
    }
  }

  const whereCondition = whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions);
  const rows = await context.db
    .select({
      ...getTableColumns(datasetVariableTable),
    })
    .from(datasetVariableTable)
    .leftJoin(
      datasetVariablesetContent,
      and(
        eq(datasetVariableTable.id, datasetVariablesetContent.variableId),
        eq(datasetVariablesetContent.contentType, "variable")
      )
    )
    .where(whereCondition)
    .orderBy(datasetVariableTable.name)
    .execute();

  return paginateRows(rows as VariablesetVariableRow[], options.limit, options.offset);
}

export async function listVariablesetVariables(context: ProcedureContextInput, input: { id: string }) {
  return call(variablesList, input, { context: toProcedureContext(context) });
}

export async function getVariablesetContents(context: ProcedureContextInput, input: { id: string }) {
  return call(contentsGet, input, { context: toProcedureContext(context) });
}

export async function listDatasetVariablesetVariables(
  context: ProcedureContextInput,
  input: DatasetVariablesetVariablesInput
) {
  return call(datasetVariablesList, input, { context: toProcedureContext(context) });
}

const variablesList = authenticatedVariablesetApi.variables.list.handler(async ({ context, input }) => {
  const variableset = await getVariablesetRecord(context, input.id);

  await requireDatasetAccess(context, variableset.datasetId);

  return getVariablesInSet(context, input.id, {
    limit: 1000,
    offset: 0,
  });
});

const contentsGet = authenticatedVariablesetApi.contents.get.handler(async ({ context, input }) => {
  const variableset = await getVariablesetRecord(context, input.id);

  await requireDatasetAccess(context, variableset.datasetId);

  const contents = await context.db
    .select({
      attributes: datasetVariablesetContent.attributes,
      contentType: datasetVariablesetContent.contentType,
      createdAt: datasetVariablesetContent.createdAt,
      id: datasetVariablesetContent.id,
      position: datasetVariablesetContent.position,
      subsetCategory: subsetVariablesetTable.category,
      subsetDescription: subsetVariablesetTable.description,
      subsetId: datasetVariablesetContent.subsetId,
      subsetName: subsetVariablesetTable.name,
      updatedAt: datasetVariablesetContent.updatedAt,
      variableId: datasetVariablesetContent.variableId,
      variableLabel: datasetVariableTable.label,
      variableMeasure: datasetVariableTable.measure,
      variableName: datasetVariableTable.name,
      variableType: datasetVariableTable.type,
      variablesetId: datasetVariablesetContent.variablesetId,
    })
    .from(datasetVariablesetContent)
    .leftJoin(datasetVariableTable, eq(datasetVariablesetContent.variableId, datasetVariableTable.id))
    .leftJoin(subsetVariablesetTable, eq(datasetVariablesetContent.subsetId, subsetVariablesetTable.id))
    .where(eq(datasetVariablesetContent.variablesetId, input.id))
    .orderBy(datasetVariablesetContent.position)
    .execute();

  return { contents };
});

const datasetVariablesList = authenticatedVariablesetApi.datasetVariables.list.handler(async ({ context, input }) => {
  await requireDatasetAccess(context, input.id);

  if (input.unassigned === "true") {
    return getUnassignedVariables(context, input.id, {
      limit: input.limit,
      offset: input.offset,
      search: input.search,
    });
  }

  const variableset = await getVariablesetRecord(context, input.setId);

  if (variableset.datasetId !== input.id) {
    throw notFoundError("Variableset not found in dataset");
  }

  return getVariablesInSet(context, input.setId, {
    limit: input.limit,
    offset: input.offset,
    search: input.search,
  });
});

export const variableset = {
  contents: {
    get: contentsGet,
  },
  datasetVariables: {
    list: datasetVariablesList,
  },
  variables: {
    list: variablesList,
  },
};
