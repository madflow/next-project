"use server";

import { sql } from "drizzle-orm";
import { defaultClient as db } from "@repo/database/clients";
import {
  type CreateOrganizationData as CreateData,
  type UpdateOrganizationData as UpdateData,
  organization as entity,
  insertOrganizationSchema,
  member,
  updateOrganizationSchema,
} from "@repo/database/schema";
import { getSessionOrThrow, withAdminAuth } from "@/lib/server-action-utils";
import { getServerAPIClient } from "@/lib/server-api-client";

export const create = withAdminAuth(async (data: CreateData) => {
  const parsedData = insertOrganizationSchema.parse(data);
  const session = await getSessionOrThrow();
  const userId = session.user.id;

  const cte = db.$with("createdOrg").as(db.insert(entity).values(parsedData).returning());
  await db
    .with(cte)
    .insert(member)
    .values({
      organizationId: sql`(select "id" from ${cte})`,
      userId,
      role: "owner",
      createdAt: new Date(),
    });
});

export const update = withAdminAuth(async (id: string, data: UpdateData) => {
  const api = await getServerAPIClient();
  const parsedData = updateOrganizationSchema.parse(data);
  const body = Object.fromEntries(Object.entries(parsedData).filter(([key]) => key !== "id"));

  await api.organization.update({
    body,
    params: { id },
  });
});

export const remove = withAdminAuth(async (id: string) => {
  const api = await getServerAPIClient();

  await api.organization.delete({ id });
});
