"use server";

import { addSplitVariable, removeSplitVariable } from "@/dal/dataset-splitvariable";
import { assertUserIsAdmin } from "@/lib/dal";
import { ServerActionFailureException } from "@/lib/exception";

export async function addSplitVariableAction(datasetId: string, variableId: string) {
  assertUserIsAdmin();

  const created = await addSplitVariable(datasetId, variableId);

  if (!created) {
    throw new ServerActionFailureException("Failed to add split variable");
  }

  return created;
}

export async function removeSplitVariableAction(datasetId: string, variableId: string) {
  assertUserIsAdmin();

  await removeSplitVariable(datasetId, variableId);
}