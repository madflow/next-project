import type { AuthInstance } from "@repo/auth/server";
import type { DatabaseInstance } from "@repo/database/clients";
import { type Principal, resolvePrincipal } from "./auth/principal";

type CreateORPCContextOptions = {
  auth: AuthInstance;
  db: DatabaseInstance;
  headers: Headers;
};

export const createORPCContext = async ({
  auth,
  db,
  headers,
}: CreateORPCContextOptions): Promise<{
  db: DatabaseInstance;
  headers: Headers;
  principal: Principal;
}> => {
  return {
    db,
    headers,
    principal: await resolvePrincipal({ auth, db, headers }),
  };
};

export type Context = Awaited<ReturnType<typeof createORPCContext>>;
