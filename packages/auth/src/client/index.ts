import { adminClient, inferAdditionalFields, organizationClient } from "better-auth/client/plugins";
import { createAuthClient as createBetterAuthClient } from "better-auth/react";
import type { AuthInstance } from "../server";

export type CreateAuthClientOptions = {
  baseURL?: string;
};

function createAdditionalFieldsPlugin() {
  return inferAdditionalFields<AuthInstance>();
}

type AuthClientPlugins = [
  // Better Auth uses an empty options object for the default client plugin typings.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  ReturnType<typeof adminClient<{}>>,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  ReturnType<typeof organizationClient<{}>>,
  ReturnType<typeof createAdditionalFieldsPlugin>,
];

type AuthClientConfig = {
  baseURL?: string;
  plugins: AuthClientPlugins;
};

export type AuthClient = ReturnType<typeof createBetterAuthClient<AuthClientConfig>>;

function createAuthClientPlugins(): AuthClientPlugins {
  return [adminClient(), organizationClient(), createAdditionalFieldsPlugin()];
}

export function createAuthClient({ baseURL }: CreateAuthClientOptions = {}): AuthClient {
  return createBetterAuthClient({
    ...(baseURL ? { baseURL } : {}),
    plugins: createAuthClientPlugins(),
  });
}
