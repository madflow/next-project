import "server-only";
import { and, eq } from "drizzle-orm";
import { defaultClient as db } from "@repo/database/clients";
import { CreateDatasetSplitVariableData, datasetSplitVariable as entity } from "@repo/database/schema";
import { withAdminCheck } from "@/dal/dal";
import { DalException } from "@/lib/exception";

async function addSplitVariableFn(datasetId: string, variableId: string) {
  // Check if variable is already a split variable
  const existing = await db
    .select()
    .from(entity)
    .where(and(eq(entity.datasetId, datasetId), eq(entity.variableId, variableId)))
    .limit(1);

  if (existing.length > 0) {
    throw new DalException("Variable is already a split variable");
  }

  const insertData: CreateDatasetSplitVariableData = {
    datasetId,
    variableId,
  };

  const [created] = await db.insert(entity).values(insertData).returning();

  if (!created) {
    throw new DalException("Failed to add split variable");
  }

  return created;
}

async function removeSplitVariableFn(datasetId: string, variableId: string) {
  await db.delete(entity).where(and(eq(entity.datasetId, datasetId), eq(entity.variableId, variableId)));
}

export const addSplitVariable = withAdminCheck(addSplitVariableFn);
export const removeSplitVariable = withAdminCheck(removeSplitVariableFn);
