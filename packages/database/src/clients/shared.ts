import { type NodePgDatabase, drizzle } from "drizzle-orm/node-postgres";
import type { Pool } from "pg";
import * as schema from "../schema/index.js";

export type DatabaseClientOptions = {
  databaseUrl?: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
};

export type DatabaseInstance = NodePgDatabase<typeof schema> & {
  $client: Pool;
};

function getConnectionString(databaseUrl?: string) {
  const connectionString = databaseUrl ?? process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  return connectionString;
}

export function createDatabaseClient(options?: DatabaseClientOptions): DatabaseInstance {
  return drizzle({
    schema,
    connection: {
      connectionString: getConnectionString(options?.databaseUrl),
      max: options?.max ?? 20,
      idleTimeoutMillis: options?.idleTimeoutMillis ?? 30000,
      connectionTimeoutMillis: options?.connectionTimeoutMillis ?? 2000,
    },
  });
}
