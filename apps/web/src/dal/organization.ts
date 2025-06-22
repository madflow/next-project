import "server-only";
import { organization as entity, selectOrganizationSchema } from "@repo/database/schema";
import { createFind, createList, withAdminCheck } from "@/lib/dal";

export const find = withAdminCheck(createFind(entity, selectOrganizationSchema));

export const list = withAdminCheck(createList(entity, selectOrganizationSchema));
