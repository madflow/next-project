import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@repo/api", "@repo/ui", "@t3-oss/env-nextjs", "@t3-oss/env-core"],
  typedRoutes: true,
  turbopack: {
    resolveAlias: {
      "zod/v4/core": "./src/lib/zod-v4-core-shim.js",
    },
  },
  experimental: {
    proxyClientMaxBodySize: "105mb",
    serverActions: {
      bodySizeLimit: "105mb",
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
