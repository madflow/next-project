import { defaultClient as db } from "@repo/database/clients";

export type DatabaseClient = typeof db;

export function getDatabaseClient(): DatabaseClient {
  return db;
}
