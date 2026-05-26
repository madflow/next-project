"use server";

import { UpdateDatasetVariableData } from "@repo/database/schema";
import { withAdminAuth } from "@/lib/server-action-utils";
import { getServerAPIClient } from "@/lib/server-api-client";

export const update = withAdminAuth(async (id: string, data: UpdateDatasetVariableData) => {
  const api = await getServerAPIClient();
  const body = Object.fromEntries(Object.entries(data).filter(([key]) => key !== "id"));

  return api.datasetVariable.update({
    body,
    params: { id },
  });
});

export const remove = withAdminAuth(async (id: string) => {
  const api = await getServerAPIClient();

  await api.datasetVariable.delete({ id });
});
