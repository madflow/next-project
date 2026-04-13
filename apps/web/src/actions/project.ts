"use server";

import { eq } from "drizzle-orm";
import {
  type CreateProjectData as CreateData,
  type UpdateProjectData as UpdateData,
  project as entity,
} from "@repo/database/schema";
import { getAdminClient } from "@/dal/dal";
import { withAdminAuth } from "@/lib/server-action-utils";

export const create = withAdminAuth(async (data: CreateData) => {
  const db = await getAdminClient();
  await db.insert(entity).values(data).returning();
});

export const update = withAdminAuth(async (id: string, data: UpdateData) => {
  const db = await getAdminClient();
  await db.update(entity).set(data).where(eq(entity.id, id)).returning();
});

export const remove = withAdminAuth(async (id: string) => {
  const db = await getAdminClient();
  await db.delete(entity).where(eq(entity.id, id));
});
