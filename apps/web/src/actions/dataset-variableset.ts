"use server";

import {
  CreateDatasetVariablesetData,
  DatasetVariablesetContentType,
  UpdateDatasetVariablesetData,
  VariablesetContentAttributes,
} from "@repo/database/schema";
import {
  addContentToVariableset,
  create,
  detachSubset,
  remove,
  removeContentFromVariableset,
  reorderContents,
  reorderVariablesets,
  update,
  updateContentAttributes,
} from "@/dal/dataset-variableset";
import { ServerActionFailureException } from "@/lib/exception";

export async function createVariableset(data: CreateDatasetVariablesetData) {
  const created = await create(data);

  if (!created) {
    throw new ServerActionFailureException("Failed to create variable set");
  }

  return created;
}

export async function updateVariableset(id: string, data: UpdateDatasetVariablesetData) {
  const updated = await update(id, data);

  if (!updated) {
    throw new ServerActionFailureException("Failed to update variable set");
  }

  return updated;
}

export async function deleteVariableset(id: string) {
  await remove(id);
}

export async function updateContentAttributesAction(
  variablesetId: string,
  variableId: string,
  attributes: VariablesetContentAttributes | null
) {
  if (attributes?.valueRange && attributes.valueRange.min > attributes.valueRange.max) {
    throw new ServerActionFailureException("Min value must be less than or equal to max value");
  }

  const updated = await updateContentAttributes(variablesetId, variableId, attributes);

  if (!updated) {
    throw new ServerActionFailureException("Failed to update content attributes");
  }

  return updated;
}

export async function reorderVariablesetsAction(datasetId: string, parentId: string | null, reorderedIds: string[]) {
  const result = await reorderVariablesets(datasetId, parentId, reorderedIds);

  if (!result || !result.success) {
    throw new ServerActionFailureException("Failed to reorder variablesets");
  }

  return result;
}

export async function addContentToVariablesetAction(
  variablesetId: string,
  contentType: DatasetVariablesetContentType,
  referenceId: string,
  attributes?: VariablesetContentAttributes | null
) {
  const created = await addContentToVariableset(variablesetId, contentType, referenceId, attributes);

  if (!created) {
    throw new ServerActionFailureException("Failed to add content to variableset");
  }

  return created;
}

export async function removeContentFromVariablesetAction(variablesetId: string, contentId: string) {
  await removeContentFromVariableset(variablesetId, contentId);
}

export async function reorderContentsAction(variablesetId: string, reorderedContentIds: string[]) {
  const result = await reorderContents(variablesetId, reorderedContentIds);

  if (!result || !result.success) {
    throw new ServerActionFailureException("Failed to reorder variableset contents");
  }

  return result;
}

export async function detachSubsetAction(subsetId: string) {
  await detachSubset(subsetId);
}
