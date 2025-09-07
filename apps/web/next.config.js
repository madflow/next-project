import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@t3-oss/env-nextjs", "@t3-oss/env-core"],
  typedRoutes: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
};
const withNextIntl = createNextIntlPlugin();
export default withNextIntl(
  withSentryConfig(nextConfig, {
    org: "rh-5k",
    project: "next-project",
    telemetry: false,
    silent: false,
    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,
  })
);
