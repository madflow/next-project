import "server-only";
import { and, eq } from "drizzle-orm";
import { project as entity, member, organization, selectProjectSchema } from "@repo/database/schema";
import { createFind, createFindBySlug, getAuthenticatedClient, getSessionUser, withSessionCheck } from "@/dal/dal";

const findFn = createFind(entity, selectProjectSchema);

export const find = withSessionCheck(findFn);

export const findBySlug = withSessionCheck(createFindBySlug(entity, selectProjectSchema));

export async function hasAccess(projectId: string) {
  const user = await getSessionUser();
  if (!user) {
    return false;
  }

  if (user.role === "admin") {
    return true;
  }

  const db = await getAuthenticatedClient();

  const rows = await db
    .select()
    .from(member)
    .innerJoin(organization, eq(organization.id, member.organizationId))
    .innerJoin(entity, eq(entity.organizationId, organization.id))
    .where(and(eq(member.organizationId, organization.id), eq(member.userId, user.id), eq(entity.id, projectId)));
  return rows.length > 0;
}
