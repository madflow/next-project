"use server";

import { revalidatePath } from "next/cache";
import { CreateDatasetVariablesetData, UpdateDatasetVariablesetData } from "@repo/database/schema";
import { addVariableToSet, create, remove, removeVariableFromSet, update } from "@/dal/dataset-variableset";
import { assertUserIsAdmin } from "@/lib/dal";
import { ServerActionFailureException } from "@/lib/exception";

export async function createVariableset(data: CreateDatasetVariablesetData) {
  assertUserIsAdmin();

  const created = await create(data);

  if (!created) {
    throw new ServerActionFailureException("Failed to create variable set");
  }

  revalidatePath(`/admin/datasets/${data.datasetId}/editor`);
  return created;
}

export async function updateVariableset(id: string, data: UpdateDatasetVariablesetData) {
  assertUserIsAdmin();

  const updated = await update(id, data);

  if (!updated) {
    throw new ServerActionFailureException("Failed to update variable set");
  }

  revalidatePath(`/admin/datasets/${updated.datasetId}/editor`);
  return updated;
}

export async function deleteVariableset(id: string, datasetId: string) {
  assertUserIsAdmin();

  await remove(id);
  revalidatePath(`/admin/datasets/${datasetId}/editor`);
}

export async function addVariableToVariableset(
  variablesetId: string,
  variableId: string,
  datasetId: string,
  orderIndex?: number
) {
  assertUserIsAdmin();

  await addVariableToSet(variablesetId, variableId, orderIndex);
  revalidatePath(`/admin/datasets/${datasetId}/editor`);
}

export async function removeVariableFromVariableset(variablesetId: string, variableId: string, datasetId: string) {
  assertUserIsAdmin();

  await removeVariableFromSet(variablesetId, variableId);
  revalidatePath(`/admin/datasets/${datasetId}/editor`);
}
