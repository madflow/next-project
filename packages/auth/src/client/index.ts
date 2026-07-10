import {
  type Organization as BetterAuthOrganization,
  type SessionWithImpersonatedBy,
  adminClient,
  inferAdditionalFields,
  organizationClient,
} from "better-auth/client/plugins";
import { createAuthClient as createBetterAuthClient } from "better-auth/react";
import type { AuthInstance } from "../server";

export type AuthOrganization = BetterAuthOrganization;
export type AuthImpersonatedSession = SessionWithImpersonatedBy;

export type CreateAuthClientOptions = {
  baseURL?: string;
};

function createAdditionalFieldsPlugin() {
  return inferAdditionalFields<AuthInstance>();
}

const defaultAuthClientPlugins = [adminClient({}), organizationClient({}), createAdditionalFieldsPlugin()];

type AuthClientConfig = {
  baseURL?: string;
  plugins: typeof defaultAuthClientPlugins;
};

export type AuthClient = ReturnType<typeof createBetterAuthClient<AuthClientConfig>>;

export function createAuthClient({ baseURL }: CreateAuthClientOptions = {}): AuthClient {
  return createBetterAuthClient({
    ...(baseURL ? { baseURL } : {}),
    plugins: defaultAuthClientPlugins,
  });
}
