import baseConfig from "@repo/prettier-config";

export default {
  ...baseConfig,
  plugins: ["@trivago/prettier-plugin-sort-imports", "prettier-plugin-tailwindcss", "prettier-plugin-sort-json"],
  jsonRecursiveSort: true,
};
