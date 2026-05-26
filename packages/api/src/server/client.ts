import { type RouterClient, createRouterClient } from "@orpc/server";
import type { AuthInstance } from "@repo/auth/server";
import type { DatabaseInstance } from "@repo/database/clients";
import { appRouter } from "./router";

type CreateServerAPIClientOptions = {
  auth: AuthInstance;
  db: DatabaseInstance;
  headers: Headers;
};

export type ServerAPIClient = RouterClient<typeof appRouter>;

export function createServerAPIClient({ auth, db, headers }: CreateServerAPIClientOptions): ServerAPIClient {
  return createRouterClient(appRouter, {
    context: async () => ({
      db,
      headers,
      principal: await resolvePrincipal({ auth, db, headers }),
    }),
  });
}

async function resolvePrincipal({ auth, db, headers }: CreateServerAPIClientOptions) {
  const { resolvePrincipal } = await import("./auth/principal");
  return resolvePrincipal({ auth, db, headers });
}
