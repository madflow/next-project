import "server-only";
import { eq } from "drizzle-orm";
import { member as entity, selectMemberSchema, user } from "@repo/database/schema";
import { withAdminCheck } from "@/dal/dal";
import { createListWithJoins } from "@/dal/dal-joins";

export const listWithUser = withAdminCheck(
  createListWithJoins(entity, selectMemberSchema, [
    {
      table: user,
      condition: eq(entity.userId, user.id),
    },
  ])
);
