"use server";

import { eq } from "drizzle-orm";
import { defaultClient as db } from "@repo/database/clients";
import {
  type CreateProjectData as CreateData,
  type UpdateProjectData as UpdateData,
  project as entity,
  type Project,
} from "@repo/database/schema";
import { assertUserIsAdmin } from "@/lib/dal";

export async function create(data: CreateData) {
  assertUserIsAdmin();
  await db.insert(entity).values(data).returning();
}

export async function update(id: string, data: UpdateData) {
  assertUserIsAdmin();
  await db.update(entity).set(data).where(eq(entity.id, id)).returning();
}

export async function remove(id: string) {
  assertUserIsAdmin();
  await db.delete(entity).where(eq(entity.id, id));
}

export async function listProjects(): Promise<Pick<Project, 'id' | 'name'>[]> {
  const result = await db.select({
    id: entity.id,
    name: entity.name,
  }).from(entity);
  
  return result;
}
