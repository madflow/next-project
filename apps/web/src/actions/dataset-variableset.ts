"use server";

import {
  CreateDatasetVariablesetData,
  CreateDatasetVariablesetItemData,
  UpdateDatasetVariablesetData,
} from "@repo/database/schema";
import {
  addVariableToSet,
  create,
  remove,
  removeVariableFromSet,
  update,
  updateVariablesetItemAttributes as updateVariablesetItemAttributesDal,
} from "@/dal/dataset-variableset";
import { assertUserIsAdmin } from "@/lib/dal";
import { ServerActionFailureException } from "@/lib/exception";

export async function createVariableset(data: CreateDatasetVariablesetData) {
  assertUserIsAdmin();

  const created = await create(data);

  if (!created) {
    throw new ServerActionFailureException("Failed to create variable set");
  }

  return created;
}

export async function updateVariableset(id: string, data: UpdateDatasetVariablesetData) {
  assertUserIsAdmin();

  const updated = await update(id, data);

  if (!updated) {
    throw new ServerActionFailureException("Failed to update variable set");
  }

  return updated;
}

export async function deleteVariableset(id: string) {
  assertUserIsAdmin();

  await remove(id);
}

export async function addVariableToVariableset(variablesetId: string, variableId: string, orderIndex?: number) {
  assertUserIsAdmin();

  await addVariableToSet(variablesetId, variableId, orderIndex);
}

export async function removeVariableFromVariableset(variablesetId: string, variableId: string) {
  assertUserIsAdmin();

  await removeVariableFromSet(variablesetId, variableId);
}

export async function updateVariablesetItemAttributes(
  variablesetId: string,
  variableId: string,
  attributes: CreateDatasetVariablesetItemData["attributes"]
) {
  assertUserIsAdmin();

  const updated = await updateVariablesetItemAttributesDal(variablesetId, variableId, attributes);

  if (!updated) {
    throw new ServerActionFailureException("Failed to update variableset item attributes");
  }

  return updated;
}
