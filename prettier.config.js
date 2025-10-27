import baseConfig from "./packages/prettier-config/index.js";

export default {
  ...baseConfig,
  plugins: ["@trivago/prettier-plugin-sort-imports", "prettier-plugin-tailwindcss", "prettier-plugin-sort-json"],
  jsonRecursiveSort: true,
};
