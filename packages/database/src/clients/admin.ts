import { type DatabaseClientOptions, type DatabaseInstance, createDatabaseClient } from "./shared.js";

let client: DatabaseInstance | undefined;

export type { DatabaseClientOptions, DatabaseInstance };

export function createClient(options?: DatabaseClientOptions): DatabaseInstance {
  return createDatabaseClient(options);
}

export function getClient(): DatabaseInstance {
  client ??= createClient();
  return client;
}
