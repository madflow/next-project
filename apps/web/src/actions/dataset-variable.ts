"use server";

import { UpdateDatasetVariableData } from "@repo/database/schema";
import { remove as dalRemove, update as dalUpdate } from "@/dal/dataset-variable";
import { ServerActionFailureException } from "@/lib/exception";

export async function update(id: string, data: UpdateDatasetVariableData) {
  const updatedVariable = await dalUpdate(id, data);

  if (!updatedVariable) {
    throw new ServerActionFailureException("Failed to update dataset variable");
  }

  return updatedVariable;
}

export async function remove(id: string) {
  await dalRemove(id);
}
