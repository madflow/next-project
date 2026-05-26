"use server";

import { withAdminAuth } from "@/lib/server-action-utils";
import { getServerAPIClient } from "@/lib/server-api-client";

export const addSplitVariableAction = withAdminAuth(async (datasetId: string, variableId: string) => {
  const api = await getServerAPIClient();

  return api.dataset.splitVariables.create({ id: datasetId, variableId });
});

export const removeSplitVariableAction = withAdminAuth(async (datasetId: string, variableId: string) => {
  const api = await getServerAPIClient();

  await api.dataset.splitVariables.delete({ id: datasetId, variableId });
});
