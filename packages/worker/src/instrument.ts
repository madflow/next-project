import * as Sentry from "@sentry/node";

const { SENTRY_DSN } = process.env;

// Ensure to call this before importing any other modules!
Sentry.init({
  dsn: SENTRY_DSN,
  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});
