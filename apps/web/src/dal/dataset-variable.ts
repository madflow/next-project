import "server-only";
import { eq } from "drizzle-orm";
import { defaultClient as db } from "@repo/database/clients";
import {
  UpdateDatasetVariableData,
  datasetVariable as entity,
  updateDatasetVariableSchema,
} from "@repo/database/schema";
import { withAdminCheck } from "@/dal/dal";
import { DalException } from "@/lib/exception";

async function updateFn(id: string, data: UpdateDatasetVariableData) {
  const updateData = updateDatasetVariableSchema.parse(data);

  const [updatedVariable] = await db.update(entity).set(updateData).where(eq(entity.id, id)).returning();

  if (!updatedVariable) {
    throw new DalException("Failed to update dataset variable");
  }

  return updatedVariable;
}

async function removeFn(id: string) {
  await db.delete(entity).where(eq(entity.id, id));
}

export const remove = withAdminCheck(removeFn);
export const update = withAdminCheck(updateFn);
