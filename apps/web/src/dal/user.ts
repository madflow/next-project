import "server-only";
import { user as entity, selectUserSchema } from "@repo/database/schema";
import { createFind, createList, withAdminCheck } from "@/lib/dal";

export const find = withAdminCheck(createFind(entity, selectUserSchema));

export const list = withAdminCheck(createList(entity, selectUserSchema));
