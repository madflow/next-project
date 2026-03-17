import "server-only";
import { and, eq } from "drizzle-orm";
import { organization as entity, member, selectOrganizationSchema } from "@repo/database/schema";
import {
  createFind,
  createList,
  getAuthenticatedClient,
  getSessionUser,
  withAdminCheck,
  withSessionCheck,
} from "@/dal/dal";
import { DalNotAuthorizedException } from "@/lib/exception";

const findFn = createFind(entity, selectOrganizationSchema);

export const find = withAdminCheck(findFn);

export const findAccessible = withSessionCheck(async (organizationId: string) => {
  await assertAccess(organizationId);
  return await findFn(organizationId);
});

export const list = withAdminCheck(createList(entity, selectOrganizationSchema));

export async function assertAccess(organizationId: string) {
  const canAccess = await hasAccess(organizationId);
  if (!canAccess) {
    throw new DalNotAuthorizedException("You do not have access to this organization");
  }
}

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
