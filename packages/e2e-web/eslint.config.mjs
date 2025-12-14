import playwright from "eslint-plugin-playwright";
import { config } from "@repo/eslint-config/base";

/** @type {import("eslint").Linter.Config} */
export default [
  ...config,
  {
    ...playwright.configs["flat/recommended"],
    files: ["tests/**"],
    rules: {
      ...playwright.configs["flat/recommended"].rules,
      // Customize specific rules if needed, for example:
      // 'playwright/no-force-option': 'error',
    },
  },
];
