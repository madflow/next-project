"use server";

import { eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { defaultClient as db } from "@repo/database/clients";
import {
  type CreateOrganizationData as CreateData,
  type UpdateOrganizationData as UpdateData,
  organization as entity,
  member,
} from "@repo/database/schema";
import { auth } from "@/lib/auth";
import { assertUserIsAdmin } from "@/lib/dal";

export async function create(data: CreateData) {
  await assertUserIsAdmin();
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("Unauthorized");
  }
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
}

export async function update(id: string, data: UpdateData) {
  await assertUserIsAdmin();
  await db.update(entity).set(data).where(eq(entity.id, id));
}

export async function remove(id: string) {
  await assertUserIsAdmin();
  await db.delete(entity).where(eq(entity.id, id));
}
