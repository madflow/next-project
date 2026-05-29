import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../schema/index.ts";

export { client as defaultClient, pool as defaultPool } from "./default.ts";
export { client as adminClient, pool as adminPool } from "./admin.ts";

export type DatabaseInstance = NodePgDatabase<typeof schema>;
