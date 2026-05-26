import { ORPCError } from "@orpc/server";
import { and, eq, getTableColumns, isNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import {
  type CreateDatasetVariablesetData,
  type Dataset,
  type DatasetVariableset as DatasetVariablesetRecord,
  type UpdateDatasetVariablesetData,
  dataset,
  datasetVariablesetContent,
  datasetVariableset as datasetVariablesetTable,
} from "@repo/database/schema";
import { type ProcedureContextInput, adminApi, authenticatedApi, call, toProcedureContext } from "../../base";
import { listCollection } from "../../collection-query";
import { getDatasetRelatedAccessWhere } from "../dataset/access";
import { datasetVariablesetQueryDefinition } from "./query-definition";

const adminDatasetVariablesetApi = adminApi.datasetVariableset;
const authenticatedDatasetVariablesetApi = authenticatedApi.datasetVariableset;
const parentVariableset = alias(datasetVariablesetTable, "parent_dataset_variableset");

type DatasetVariablesetListRow = DatasetVariablesetRecord & {
  dataset?: Dataset;
  parent?: DatasetVariablesetRecord;
};

type UpdateDatasetVariablesetInput = {
  body: Omit<UpdateDatasetVariablesetData, "id">;
  params: {
    id: string;
  };
};

export async function createDatasetVariableset(context: ProcedureContextInput, input: CreateDatasetVariablesetData) {
  return call(create, input, { context: toProcedureContext(context) });
}

export async function updateDatasetVariableset(context: ProcedureContextInput, input: UpdateDatasetVariablesetInput) {
  return call(update, input, { context: toProcedureContext(context) });
}

export async function deleteDatasetVariableset(context: ProcedureContextInput, input: { id: string }) {
  return call(remove, input, { context: toProcedureContext(context) });
}

export async function reorderDatasetVariablesets(
  context: ProcedureContextInput,
  input: {
    datasetId: string;
    parentId: string | null;
    reorderedIds: string[];
  }
) {
  return call(reorder, input, { context: toProcedureContext(context) });
}

export async function detachDatasetVariableset(context: ProcedureContextInput, input: { id: string }) {
  return call(detach, input, { context: toProcedureContext(context) });
}

const create = adminDatasetVariablesetApi.create.handler(async ({ context, input }) => {
  return context.db.transaction(async (tx) => {
    const [datasetVariableset] = await tx.insert(datasetVariablesetTable).values(input).returning();

    if (datasetVariableset === undefined) {
      throw new Error("Failed to create dataset variableset");
    }

    if (datasetVariableset.parentId) {
      const maxPosition = await tx
        .select({ maxPos: sql<number>`COALESCE(MAX(${datasetVariablesetContent.position}), -100)` })
        .from(datasetVariablesetContent)
        .where(eq(datasetVariablesetContent.variablesetId, datasetVariableset.parentId));

      await tx.insert(datasetVariablesetContent).values({
        contentType: "subset",
        position: (maxPosition[0]?.maxPos ?? -100) + 100,
        subsetId: datasetVariableset.id,
        variablesetId: datasetVariableset.parentId,
      });
    }

    return datasetVariableset;
  });
});

const list = authenticatedDatasetVariablesetApi.list.handler(async ({ context, input }) => {
  const accessWhere = getDatasetRelatedAccessWhere(context, datasetVariablesetTable.datasetId);

  return listCollection<DatasetVariablesetListRow>({
    db: context.db,
    definition: datasetVariablesetQueryDefinition,
    embedSelections: {
      dataset: getTableColumns(dataset),
      parent: getTableColumns(parentVariableset),
    },
    input,
    where: accessWhere,
  });
});

const update = adminDatasetVariablesetApi.update.handler(async ({ context, input }) => {
  const [datasetVariableset] = await context.db
    .update(datasetVariablesetTable)
    .set(input.body)
    .where(eq(datasetVariablesetTable.id, input.params.id))
    .returning();

  if (datasetVariableset === undefined) {
    throw new ORPCError("NOT_FOUND", {
      message: "Variableset not found",
      status: 404,
    });
  }

  return datasetVariableset;
});

const remove = adminDatasetVariablesetApi.delete.handler(async ({ context, input }) => {
  const [datasetVariableset] = await context.db
    .delete(datasetVariablesetTable)
    .where(eq(datasetVariablesetTable.id, input.id))
    .returning();

  if (datasetVariableset === undefined) {
    throw new ORPCError("NOT_FOUND", {
      message: "Variableset not found",
      status: 404,
    });
  }

  return datasetVariableset;
});

const reorder = adminDatasetVariablesetApi.reorder.handler(async ({ context, input }) => {
  const variablesets = await context.db
    .select({ id: datasetVariablesetTable.id })
    .from(datasetVariablesetTable)
    .where(
      and(
        eq(datasetVariablesetTable.datasetId, input.datasetId),
        input.parentId ? eq(datasetVariablesetTable.parentId, input.parentId) : isNull(datasetVariablesetTable.parentId)
      )
    )
    .execute();

  const existingIds = new Set(variablesets.map((variableset) => variableset.id));

  if (new Set(input.reorderedIds).size !== input.reorderedIds.length) {
    throw new ORPCError("BAD_REQUEST", {
      message: "reorderedIds must not contain duplicate variableset IDs",
      status: 400,
    });
  }

  const invalidIds = input.reorderedIds.filter((id) => !existingIds.has(id));

  if (invalidIds.length > 0) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Some variablesets do not belong to the specified parent",
      status: 400,
    });
  }

  if (input.reorderedIds.length !== variablesets.length) {
    throw new ORPCError("BAD_REQUEST", {
      message: "reorderedIds must include every sibling variableset exactly once",
      status: 400,
    });
  }

  await context.db.transaction(async (tx) => {
    for (let index = 0; index < input.reorderedIds.length; index++) {
      const id = input.reorderedIds[index];

      if (!id) {
        continue;
      }

      await tx
        .update(datasetVariablesetTable)
        .set({
          orderIndex: index,
          updatedAt: new Date(),
        })
        .where(eq(datasetVariablesetTable.id, id));
    }
  });

  return { success: true };
});

const detach = adminDatasetVariablesetApi.detach.handler(async ({ context, input }) => {
  await context.db.transaction(async (tx) => {
    await tx
      .delete(datasetVariablesetContent)
      .where(
        and(eq(datasetVariablesetContent.subsetId, input.id), eq(datasetVariablesetContent.contentType, "subset"))
      );

    await tx
      .update(datasetVariablesetTable)
      .set({ parentId: null, updatedAt: new Date() })
      .where(eq(datasetVariablesetTable.id, input.id));
  });

  return { success: true };
});

export const datasetVariableset = {
  create,
  delete: remove,
  detach,
  list,
  reorder,
  update,
};
