export const USER_ADMIN_ROLE = "admin";
export const USER_ROLE = "user";
export const AUTH_COOKIE_PREFIX = "auth";

export type AuthRole = typeof USER_ADMIN_ROLE | typeof USER_ROLE;

export const authUserAdditionalFields = {
  locale: {
    type: "string",
    required: false,
    input: true,
  },
  role: {
    type: "string",
    required: true,
    defaultValue: USER_ROLE,
    input: false,
  },
} as const;

export const authSessionAdditionalFields = {
  activeOrganizationId: {
    type: "string",
    required: false,
    input: false,
  },
} as const;

export function isAdminRole(role: string | null | undefined): role is typeof USER_ADMIN_ROLE {
  return role === USER_ADMIN_ROLE;
}

export function isAdminUser(user: { role?: string | null } | null | undefined) {
  return isAdminRole(user?.role);
}

export function getImpersonatedBy(session: { impersonatedBy?: string | null } | null | undefined) {
  return session?.impersonatedBy ?? null;
}

export function isImpersonatingSession(session: { impersonatedBy?: string | null } | null | undefined) {
  return getImpersonatedBy(session) !== null;
}
