import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { env } from "../env.js";

const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  // Connection pool configuration
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // timeout after 2 seconds when connecting a new client
});
const client = drizzle({
  client: pool,
});

export { client, pool };
