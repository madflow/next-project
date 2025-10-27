import "server-only";
import { and, eq } from "drizzle-orm";
import { organization as entity, member, selectOrganizationSchema } from "@repo/database/schema";
import { createFind, createList, getAuthenticatedClient, getSessionUser, withAdminCheck } from "@/lib/dal";

export const find = withAdminCheck(createFind(entity, selectOrganizationSchema));

export const list = withAdminCheck(createList(entity, selectOrganizationSchema));

export async function hasAccess(organizationId: string) {
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
    .where(and(eq(member.organizationId, organizationId), eq(member.userId, user.id)));
  return rows.length === 1;
}

export const getUserOrganizations = async () => {
  const user = await getSessionUser();
  if (!user) {
    return [];
  }

  const db = await getAuthenticatedClient();

  const orgs = await db
    .select({
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      logo: entity.logo,
      createdAt: entity.createdAt,
      metadata: entity.metadata,
      settings: entity.settings,
    })
    .from(member)
    .innerJoin(entity, eq(entity.id, member.organizationId))
    .where(eq(member.userId, user.id));

  return orgs;
};
