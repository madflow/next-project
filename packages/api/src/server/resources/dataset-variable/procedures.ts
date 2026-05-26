import { ORPCError } from "@orpc/server";
import { and, eq, getTableColumns } from "drizzle-orm";
import {
  type Dataset,
  type DatasetVariable as DatasetVariableRecord,
  type UpdateDatasetVariableData,
  dataset,
  datasetVariable as datasetVariableTable,
} from "@repo/database/schema";
import { type ProcedureContextInput, adminApi, authenticatedApi, call, toProcedureContext } from "../../base";
import { getCollectionRow, listCollection } from "../../collection-query";
import { getDatasetRelatedAccessWhere } from "../dataset/access";
import { datasetVariableQueryDefinition } from "./query-definition";

const adminDatasetVariableApi = adminApi.datasetVariable;
const authenticatedDatasetVariableApi = authenticatedApi.datasetVariable;

type DatasetVariableListRow = DatasetVariableRecord & {
  dataset?: Dataset;
};

export async function getDatasetVariable(context: ProcedureContextInput, input: { id: string }) {
  return call(get, input, { context: toProcedureContext(context) });
}

type UpdateDatasetVariableInput = {
  body: Omit<UpdateDatasetVariableData, "id">;
  params: {
    id: string;
  };
};

export async function updateDatasetVariable(context: ProcedureContextInput, input: UpdateDatasetVariableInput) {
  return call(update, input, { context: toProcedureContext(context) });
}

export async function deleteDatasetVariable(context: ProcedureContextInput, input: { id: string }) {
  return call(remove, input, { context: toProcedureContext(context) });
}

const list = authenticatedDatasetVariableApi.list.handler(async ({ context, input }) => {
  const accessWhere = getDatasetRelatedAccessWhere(context, datasetVariableTable.datasetId);

  return listCollection<DatasetVariableListRow>({
    db: context.db,
    definition: datasetVariableQueryDefinition,
    embedSelections: {
      dataset: getTableColumns(dataset),
    },
    input,
    where: accessWhere,
  });
});

const get = authenticatedDatasetVariableApi.get.handler(async ({ context, input }) => {
  const accessWhere = getDatasetRelatedAccessWhere(context, datasetVariableTable.datasetId);

  const datasetVariable = await getCollectionRow<DatasetVariableRecord>({
    db: context.db,
    definition: datasetVariableQueryDefinition,
    input,
    where: accessWhere
      ? and(eq(datasetVariableTable.id, input.id), accessWhere)
      : eq(datasetVariableTable.id, input.id),
  });

  if (datasetVariable === undefined) {
    throw new ORPCError("NOT_FOUND", {
      message: "Dataset variable not found",
      status: 404,
    });
  }

  return datasetVariable;
});

const update = adminDatasetVariableApi.update.handler(async ({ context, input }) => {
  const [datasetVariable] = await context.db
    .update(datasetVariableTable)
    .set(input.body)
    .where(eq(datasetVariableTable.id, input.params.id))
    .returning();

  if (datasetVariable === undefined) {
    throw new ORPCError("NOT_FOUND", {
      message: "Dataset variable not found",
      status: 404,
    });
  }

  return datasetVariable;
});

const remove = adminDatasetVariableApi.delete.handler(async ({ context, input }) => {
  const [datasetVariable] = await context.db
    .delete(datasetVariableTable)
    .where(eq(datasetVariableTable.id, input.id))
    .returning();

  if (datasetVariable === undefined) {
    throw new ORPCError("NOT_FOUND", {
      message: "Dataset variable not found",
      status: 404,
    });
  }

  return datasetVariable;
});

export const datasetVariable = {
  delete: remove,
  get,
  list,
  update,
};
