import { defineConfig } from "drizzle-kit";
import "./instrumentation.ts";

const useSsl = process.env.NODE_ENV === "production";

export default defineConfig({
  out: "./migrations",
  schema: "./dist/schema/index.mjs",
  dialect: "postgresql",
  verbose: true,
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    ssl: useSsl ? { rejectUnauthorized: true } : undefined,
  },
});
