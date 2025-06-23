import "server-only";
import { project as entity, selectProjectSchema } from "@repo/database/schema";
import { createFind, createList, withSessionCheck } from "@/lib/dal";

export const find = withSessionCheck(createFind(entity, selectProjectSchema));

export const list = withSessionCheck(createList(entity, selectProjectSchema));
