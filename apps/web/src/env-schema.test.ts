import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createAppEnv } from "./env-schema";

function createRuntimeEnv(overrides: Partial<NodeJS.ProcessEnv> = {}): NodeJS.ProcessEnv {
  return {
    ANALYSIS_API_KEY: "secret",
    ANALYSIS_API_URL: "http://localhost:3003/api",
    AUTH_SECRET: "test-secret",
    AUTH_URL: "http://localhost:3000",
    AUTH_DISABLE_SIGNUP: "1",
    BASE_URL: "http://localhost:3000",
    DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/postgres",
    MAIL_DEFAULT_SENDER: "no-reply@example.com",
    NEXT_PUBLIC_BASE_URL: "http://localhost:3000",
    NEXT_PUBLIC_SITE_NAME: "Next project",
    NODE_ENV: "test",
    S3_ACCESS_KEY_ID: "s3",
    S3_BUCKET_NAME: "app",
    S3_ENDPOINT: "http://localhost:7070",
    S3_REGION: "us-east-1",
    S3_SECRET_ACCESS_KEY: "s3",
    SITE_NAME: "Next project",
    SMTP_SERVER_HOST: "localhost",
    SMTP_SERVER_PASSWORD: "password",
    SMTP_SERVER_PORT: "1025",
    SMTP_SERVER_SECURE: "false",
    SMTP_SERVER_USERNAME: "user",
    ...overrides,
  };
}

describe("createAppEnv", () => {
  test("parses required settings and booleans", () => {
    const env = createAppEnv(createRuntimeEnv());

    assert.equal(env.AUTH_DISABLE_SIGNUP, true);
    assert.equal(env.SMTP_SERVER_SECURE, false);
    assert.equal(env.SMTP_SERVER_PORT, 1025);
  });

  test("treats empty optional values as undefined", () => {
    const env = createAppEnv(createRuntimeEnv({ SENTRY_DSN: "" }));

    assert.equal(env.SENTRY_DSN, undefined);
  });

  test("fails fast when critical values are missing", () => {
    assert.throws(
      () => createAppEnv(createRuntimeEnv({ AUTH_SECRET: "" })),
      (error: unknown) => error instanceof Error && error.message === "Invalid environment variables"
    );
  });
});
