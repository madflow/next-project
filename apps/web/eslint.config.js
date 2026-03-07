import { nextJsConfig } from "@repo/eslint-config/next-js";

/** @type {import("eslint").Linter.Config} */
const localConfig = [
  {
    ignores: ["src/components/ui/**/*"],
  },
  ...nextJsConfig,
  {
    files: ["src/**"],
    rules: {
      "react/jsx-no-literals": "error",
    },
  },
];

export default localConfig;
