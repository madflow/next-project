import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

function createBooleanEnvSchema(defaultValue: boolean) {
  return z
    .enum(["true", "false", "1", "0", "yes", "no"])
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return defaultValue;
      }

      return value === "true" || value === "1" || value === "yes";
    });
}

export function createAppEnv(runtimeEnv: NodeJS.ProcessEnv) {
  return createEnv({
    server: {
      ANALYSIS_API_KEY: z.string().min(1),
      ANALYSIS_API_URL: z.string().url(),
      AUTH_SECRET: z.string().min(1),
      AUTH_URL: z.string().url(),
      AUTH_DISABLE_SIGNUP: createBooleanEnvSchema(true),
      BASE_URL: z.string().url(),
      DATABASE_URL: z.string().url(),
      MAIL_DEFAULT_SENDER: z.string().min(1),
      NEXT_RUNTIME: z.enum(["edge", "nodejs"]).default("nodejs"),
      NODE_ENV: z.enum(["development", "test", "production"]).default("production"),
      S3_ACCESS_KEY_ID: z.string().min(1),
      S3_BUCKET_NAME: z.string().min(1),
      S3_ENDPOINT: z.string().url(),
      S3_REGION: z.string().min(1).default("us-east-1"),
      S3_SECRET_ACCESS_KEY: z.string().min(1),
      SENTRY_DSN: z.string().url().optional(),
      SITE_NAME: z.string().min(1),
      SMTP_SERVER_HOST: z.string().min(1),
      SMTP_SERVER_PASSWORD: z.string().min(1),
      SMTP_SERVER_PORT: z.coerce.number().int().positive(),
      SMTP_SERVER_SECURE: createBooleanEnvSchema(false),
      SMTP_SERVER_USERNAME: z.string().min(1),
    },
    client: {
      NEXT_PUBLIC_BASE_URL: z.string().url(),
      NEXT_PUBLIC_SITE_NAME: z.string().min(1),
    },
    runtimeEnv: {
      ANALYSIS_API_KEY: runtimeEnv.ANALYSIS_API_KEY,
      ANALYSIS_API_URL: runtimeEnv.ANALYSIS_API_URL,
      AUTH_SECRET: runtimeEnv.AUTH_SECRET,
      AUTH_URL: runtimeEnv.AUTH_URL,
      AUTH_DISABLE_SIGNUP: runtimeEnv.AUTH_DISABLE_SIGNUP,
      BASE_URL: runtimeEnv.BASE_URL,
      DATABASE_URL: runtimeEnv.DATABASE_URL,
      MAIL_DEFAULT_SENDER: runtimeEnv.MAIL_DEFAULT_SENDER,
      NEXT_PUBLIC_BASE_URL: runtimeEnv.NEXT_PUBLIC_BASE_URL,
      NEXT_PUBLIC_SITE_NAME: runtimeEnv.NEXT_PUBLIC_SITE_NAME,
      NEXT_RUNTIME: runtimeEnv.NEXT_RUNTIME,
      NODE_ENV: runtimeEnv.NODE_ENV,
      S3_ACCESS_KEY_ID: runtimeEnv.S3_ACCESS_KEY_ID,
      S3_BUCKET_NAME: runtimeEnv.S3_BUCKET_NAME,
      S3_ENDPOINT: runtimeEnv.S3_ENDPOINT,
      S3_REGION: runtimeEnv.S3_REGION,
      S3_SECRET_ACCESS_KEY: runtimeEnv.S3_SECRET_ACCESS_KEY,
      SENTRY_DSN: runtimeEnv.SENTRY_DSN,
      SITE_NAME: runtimeEnv.SITE_NAME,
      SMTP_SERVER_HOST: runtimeEnv.SMTP_SERVER_HOST,
      SMTP_SERVER_PASSWORD: runtimeEnv.SMTP_SERVER_PASSWORD,
      SMTP_SERVER_PORT: runtimeEnv.SMTP_SERVER_PORT,
      SMTP_SERVER_SECURE: runtimeEnv.SMTP_SERVER_SECURE,
      SMTP_SERVER_USERNAME: runtimeEnv.SMTP_SERVER_USERNAME,
    },
    emptyStringAsUndefined: true,
  });
}
