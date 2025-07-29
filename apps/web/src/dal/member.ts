import "server-only";
import { eq } from "drizzle-orm";
import { member as entity, selectMemberSchema, user } from "@repo/database/schema";
import { createFind, createList, withAdminCheck } from "@/lib/dal";
import { createListWithJoins } from "@/lib/dal-joins";
import { defaultClient as db } from "@repo/database/clients";

export const find = withAdminCheck(createFind(entity, selectMemberSchema));

export const list = withAdminCheck(createList(entity, selectMemberSchema));

export const listWithUser = withAdminCheck(
  createListWithJoins(entity, selectMemberSchema, [
    {
      table: user,
      condition: eq(entity.userId, user.id),
    },
  ])
);

export const create = async (data: { organizationId: string; userId: string; role: string }) => {
  const [result] = await db
    .insert(entity)
    .values({
      ...data,
      createdAt: new Date(),
    })
    .returning();
  return result;
};
