import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../schema/index.js";

export { client as defaultClient, pool as defaultPool } from "./default.js";
export { client as adminClient, pool as adminPool } from "./admin.js";

export type DatabaseInstance = NodePgDatabase<typeof schema>;
