import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const booleanString = z.string().transform((val) => {
  const lower = val.toLowerCase();
  return lower === "true" || lower === "1" || lower === "yes";
});

export const env = createEnv({
  server: {
    ANALYSIS_API_KEY: z.string().default(""),
    ANALYSIS_API_URL: z.url().default(""),
    AUTH_SECRET: z.string().default(""),
    AUTH_URL: z.string().default(""),
    AUTH_DISABLE_SIGNUP: booleanString.default(true),
    BASE_URL: z.string().default(""),
    DATABASE_URL: z.url().default("postgres://"),
    MAIL_DEFAULT_SENDER: z.string().default(""),
    NEXT_RUNTIME: z.enum(["edge", "nodejs"]).default("nodejs"),
    NODE_ENV: z.enum(["development", "test", "production"]).default("production"),
    S3_ACCESS_KEY_ID: z.string().default(""),
    S3_BUCKET_NAME: z.string().default(""),
    S3_ENDPOINT: z.string().default(""),
    S3_REGION: z.string().default("us-east-1"),
    S3_SECRET_ACCESS_KEY: z.string().default(""),
    SENTRY_DSN: z.string().default(""),
    SITE_NAME: z.string().default(""),
    SMTP_SERVER_HOST: z.string().default(""),
    SMTP_SERVER_PASSWORD: z.string().default(""),
    SMTP_SERVER_PORT: z.string().default(""),
    SMTP_SERVER_USERNAME: z.string().default(""),
  },
  client: {
    NEXT_PUBLIC_BASE_URL: z.string().default(""),
    NEXT_PUBLIC_SITE_NAME: z.string().default(""),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
  },
});
