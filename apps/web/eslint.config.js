import { nextJsConfig } from "@repo/eslint-config/next-js";

/** @type {import("eslint").Linter.Config} */
const localConfig = [
  ...nextJsConfig,
  {
    files: ["!src/components/ui/**/*"],
    rules: {
      // Avoid hardcoded labels
      "react/jsx-no-literals": "error",
    },
  },
];

export default localConfig;
