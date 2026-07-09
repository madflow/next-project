import { config } from "@repo/eslint-config/react-internal";

/** @type {import("eslint").Linter.Config} */
export default [
  ...config,
  {
    files: ["src/components/file-upload.tsx"],
    rules: {
      "react-hooks/immutability": "off",
    },
  },
];
