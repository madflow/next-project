"use server";

import { eq, sql } from "drizzle-orm";
import {
  type CreateOrganizationData as CreateData,
  type UpdateOrganizationData as UpdateData,
  organization as entity,
  member,
} from "@repo/database/schema";
import { getAdminClient } from "@/dal/dal";
import { getSessionOrThrow, withAdminAuth } from "@/lib/server-action-utils";

export const create = withAdminAuth(async (data: CreateData) => {
  const session = await getSessionOrThrow();
  const userId = session.user.id;
  const db = await getAdminClient();

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
  const db = await getAdminClient();
  await db.update(entity).set(data).where(eq(entity.id, id));
});

export const remove = withAdminAuth(async (id: string) => {
  const db = await getAdminClient();
  await db.delete(entity).where(eq(entity.id, id));
});
