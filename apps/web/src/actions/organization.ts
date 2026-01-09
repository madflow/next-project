"use server";

import { eq, sql } from "drizzle-orm";
import { defaultClient as db } from "@repo/database/clients";
import {
  type CreateOrganizationData as CreateData,
  type UpdateOrganizationData as UpdateData,
  organization as entity,
  member,
} from "@repo/database/schema";
import { getSessionOrThrow, withAdminAuth } from "@/lib/server-action-utils";

export const create = withAdminAuth(async (data: CreateData) => {
  const session = await getSessionOrThrow();
  const userId = session.user.id;

  const cte = db.$with("createdOrg").as(db.insert(entity).values(data).returning());
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
  await db.update(entity).set(data).where(eq(entity.id, id));
});

export const remove = withAdminAuth(async (id: string) => {
  await db.delete(entity).where(eq(entity.id, id));
});
