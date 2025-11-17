"use server";

import { addSplitVariable, removeSplitVariable } from "@/dal/dataset-splitvariable";
import { ServerActionFailureException } from "@/lib/exception";

export async function addSplitVariableAction(datasetId: string, variableId: string) {
  const created = await addSplitVariable(datasetId, variableId);

  if (!created) {
    throw new ServerActionFailureException("Failed to add split variable");
  }

  return created;
}

export async function removeSplitVariableAction(datasetId: string, variableId: string) {
  await removeSplitVariable(datasetId, variableId);
}
