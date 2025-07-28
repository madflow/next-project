import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { env } from "../env.js";

const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
});
const client = drizzle({
  client: pool,
});

export { client, pool };
