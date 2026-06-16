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
  clientPlugins?: BetterAuthClientPlugin[];
};

function createAdditionalFieldsPlugin() {
  return inferAdditionalFields({
    session: authSessionAdditionalFields,
    user: authUserAdditionalFields,
  });
}

type DefaultAuthClientPlugins = [
  // Better Auth uses an empty options object for the default client plugin typings.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  ReturnType<typeof adminClient<{}>>,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  ReturnType<typeof organizationClient<{}>>,
  ReturnType<typeof createAdditionalFieldsPlugin>,
];

type AuthClientPlugins = [...DefaultAuthClientPlugins, ...BetterAuthClientPlugin[]];

type AuthClientConfig = {
  baseURL?: string;
  plugins: AuthClientPlugins;
};

export type AuthClient = ReturnType<typeof createBetterAuthClient<AuthClientConfig>>;

function createDefaultAuthClientPlugins(): DefaultAuthClientPlugins {
  return [adminClient(), organizationClient(), createAdditionalFieldsPlugin()];
}

export function createAuthClient({ baseURL, clientPlugins }: CreateAuthClientOptions = {}): AuthClient {
  const plugins = [...createDefaultAuthClientPlugins(), ...(clientPlugins ?? [])] as AuthClientPlugins;

  return createBetterAuthClient({
    ...(baseURL ? { baseURL } : {}),
    plugins,
  });
}
