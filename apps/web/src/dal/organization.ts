import "server-only";
import { organization as entity, selectOrganizationSchema } from "@repo/database/schema";
import { createFind, withAdminCheck } from "@/dal/dal";

const findFn = createFind(entity, selectOrganizationSchema);

export const find = withAdminCheck(findFn);
