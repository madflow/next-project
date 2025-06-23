import "server-only";
import { project as entity, selectProjectSchema } from "@repo/database/schema";
import { createFind, createList, withAdminCheck, withSessionCheck } from "@/lib/dal";

export const find = withAdminCheck(createFind(entity, selectProjectSchema));

export const list = withAdminCheck(createList(entity, selectProjectSchema));

export const listAuthenticated = withSessionCheck(createList(entity, selectProjectSchema));
