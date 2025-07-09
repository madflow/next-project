import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@t3-oss/env-nextjs", "@t3-oss/env-core"],
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
    // Only print logs for uploading source maps in CI
    // Set to `true` to suppress logs
    silent: !process.env.CI,
    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,
  })
);
