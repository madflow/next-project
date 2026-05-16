import type { DatabaseInstance } from "@repo/database/clients";

export const createORPCContext = async ({
  db,
  headers,
}: {
  db: DatabaseInstance;
  headers: Headers;
}): Promise<{
  db: DatabaseInstance;
  headers: Headers;
}> => {
  return {
    db,
    headers,
  };
};

export type Context = Awaited<ReturnType<typeof createORPCContext>>;
