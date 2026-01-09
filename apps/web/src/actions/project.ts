"use server";

import { eq } from "drizzle-orm";
import { defaultClient as db } from "@repo/database/clients";
import {
  type CreateProjectData as CreateData,
  type UpdateProjectData as UpdateData,
  project as entity,
} from "@repo/database/schema";
import { withAdminAuth } from "@/dal/server-action-utils";

export const create = withAdminAuth(async (data: CreateData) => {
  await db.insert(entity).values(data).returning();
});

export const update = withAdminAuth(async (id: string, data: UpdateData) => {
  await db.update(entity).set(data).where(eq(entity.id, id)).returning();
});

export const remove = withAdminAuth(async (id: string) => {
  await db.delete(entity).where(eq(entity.id, id));
});
