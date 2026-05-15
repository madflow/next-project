import type { DatabaseInstance } from "@repo/database/clients";

type CreateORPCContextOptions = {
  db: DatabaseInstance;
  headers: Headers;
};

export const createORPCContext = ({
  db,
  headers,
}: CreateORPCContextOptions): {
  db: DatabaseInstance;
  headers: Headers;
} => {
  return { db, headers };
};

export type Context = ReturnType<typeof createORPCContext>;
