import { defineConfig } from "drizzle-kit";
import "./instrumentation.js";

export default defineConfig({
  out: "./migrations",
  schema: "./dist/schema/index.mjs",
  dialect: "postgresql",
  verbose: true,
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: false },
  },
});
