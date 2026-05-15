import { USER_ADMIN_ROLE } from "@repo/auth/server";
import type { Principal } from "./principal";

export const authVoter = {
  canAccessAdminOperations(principal: Principal) {
    return principal.kind !== "anonymous" && principal.user.role === USER_ADMIN_ROLE;
  },
  canAccessAuthenticatedRoute(principal: Principal) {
    return principal.kind !== "anonymous";
  },
};
