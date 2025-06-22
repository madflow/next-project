import "server-only";
import { eq } from "drizzle-orm";
import { member as entity, selectMemberSchema, user } from "@repo/database/schema";
import { createFind, createList, withAdminCheck } from "@/lib/dal";
import { createListWithJoins } from "@/lib/dal-joins";

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
