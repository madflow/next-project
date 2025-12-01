"use server";

import { eq } from "drizzle-orm";
import { defaultClient as db } from "@repo/database/clients";
import {
  type CreateProjectData as CreateData,
  type UpdateProjectData as UpdateData,
  project as entity,
} from "@repo/database/schema";
import { assertUserIsAdmin } from "@/lib/dal";

export async function create(data: CreateData) {
  await assertUserIsAdmin();
  await db.insert(entity).values(data).returning();
}

export async function update(id: string, data: UpdateData) {
  await assertUserIsAdmin();
  await db.update(entity).set(data).where(eq(entity.id, id)).returning();
}

export async function remove(id: string) {
  await assertUserIsAdmin();
  await db.delete(entity).where(eq(entity.id, id));
}
