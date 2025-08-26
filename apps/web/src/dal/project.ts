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
import { createListWithJoins } from "@/lib/dal-joins";
import { DalNotAuthorizedException } from "@/lib/exception";

export const find = withSessionCheck(createFind(entity, selectProjectSchema));

export const findBySlug = withSessionCheck(createFindBySlug(entity, selectProjectSchema));

export const list = withAdminCheck(createList(entity, selectProjectSchema));

export const listAuthenticated = withSessionCheck(createList(entity, selectProjectSchema));

export const listWithOrganization = withAdminCheck(
  createListWithJoins(entity, selectProjectSchema, [
    {
      table: organization,
      condition: eq(entity.organizationId, organization.id),
    },
  ])
);

export async function assertAccess(projectId: string) {
  const canAccess = await hasAccess(projectId);
  if (!canAccess) {
    throw new DalNotAuthorizedException("You do not have access to this project");
  }
}

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
