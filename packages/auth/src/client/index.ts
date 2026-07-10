import type { BetterAuthClientPlugin } from "better-auth";
import {
  type Organization as BetterAuthOrganization,
  type SessionWithImpersonatedBy,
  adminClient,
  inferAdditionalFields,
  organizationClient,
} from "better-auth/client/plugins";
import { createAuthClient as createBetterAuthClient } from "better-auth/react";
import { authSessionAdditionalFields, authUserAdditionalFields } from "../shared";

export type AuthClientPlugin = BetterAuthClientPlugin;
export type AuthOrganization = BetterAuthOrganization;
export type AuthImpersonatedSession = SessionWithImpersonatedBy;

export type CreateAuthClientOptions = {
  baseURL?: string;
};

function createAdditionalFieldsPlugin() {
  return inferAdditionalFields({
    session: authSessionAdditionalFields,
    user: authUserAdditionalFields,
  });
}

export function createAuthClient({ baseURL }: CreateAuthClientOptions = {}) {
  return createBetterAuthClient({
    ...(baseURL ? { baseURL } : {}),
    plugins: [adminClient(), organizationClient(), createAdditionalFieldsPlugin()],
  });
}

export type AuthClient = ReturnType<typeof createAuthClient>;
