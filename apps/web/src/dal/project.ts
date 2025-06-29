import "server-only";
import { and, eq } from "drizzle-orm";
import { project as entity, member, organization, selectProjectSchema } from "@repo/database/schema";
import {
  createFind,
  createFindBySlug,
  createList,
  getAuthenticatedClient,
  getSessionUser,
  withAdminCheck,
  withSessionCheck,
} from "@/lib/dal";

export const find = withAdminCheck(createFind(entity, selectProjectSchema));

export const findBySlug = withSessionCheck(createFindBySlug(entity, selectProjectSchema));

export const list = withAdminCheck(createList(entity, selectProjectSchema));

export const listAuthenticated = withSessionCheck(createList(entity, selectProjectSchema));

export async function hasAccess(projectId: string) {
  const user = await getSessionUser();
  if (!user) {
    return false;
  }

  const db = await getAuthenticatedClient();

  const rows = await db
    .select()
    .from(member)
    .innerJoin(organization, eq(organization.id, member.organizationId))
    .innerJoin(entity, eq(entity.organizationId, organization.id))
    .where(and(eq(member.organizationId, organization.id), eq(member.userId, user.id), eq(entity.id, projectId)));
  return rows.length === 1;
}
