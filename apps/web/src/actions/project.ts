"use server";

import { type CreateProjectData as CreateData, type UpdateProjectData as UpdateData } from "@repo/database/schema";
import { withAdminAuth } from "@/lib/server-action-utils";
import { getServerAPIClient } from "@/lib/server-api-client";

export const create = withAdminAuth(async (data: CreateData) => {
  const api = await getServerAPIClient();

  await api.project.create(data);
});

export const update = withAdminAuth(async (id: string, data: UpdateData) => {
  const api = await getServerAPIClient();
  const body = Object.fromEntries(Object.entries(data).filter(([key]) => key !== "id"));

  await api.project.update({
    body,
    params: { id },
  });
});

export const remove = withAdminAuth(async (id: string) => {
  const api = await getServerAPIClient();

  await api.project.delete({ id });
});
