import "server-only";
import { eq } from "drizzle-orm";
import { defaultClient as db } from "@repo/database/clients";
import {
  UpdateDatasetData,
  datasetVariable as entity,
  selectDatasetVariableSchema,
  updateDatasetVariableSchema,
} from "@repo/database/schema";
import { ListOptions, createList, withAdminCheck, withSessionCheck } from "@/lib/dal";
import { DalException } from "@/lib/exception";

const baseList = createList(entity, selectDatasetVariableSchema);

async function listByDatasetFn(datasetId: string, options: ListOptions = {}) {
  const listOptions: ListOptions = {
    ...options,
    filters: [...(options.filters || []), { column: "datasetId", operator: "eq", value: datasetId }],
  };
  return baseList(listOptions);
}

export const listByDataset = withSessionCheck(listByDatasetFn);

async function updateFn(id: string, data: UpdateDatasetData) {
  const updateData = updateDatasetVariableSchema.parse(data);

  const [updatedVariable] = await db.update(entity).set(updateData).where(eq(entity.id, id)).returning();

  if (!updatedVariable) {
    throw new DalException("Failed to update dataset variable");
  }

  return updatedVariable;
}

async function findFn(id: string) {
  const [result] = await db.select().from(entity).where(eq(entity.id, id)).limit(1);
  return result;
}

export const find = withSessionCheck(findFn);

export const update = withAdminCheck(updateFn);
