import { defineConfig } from "tsdown";

const entry = {
  "tasks/index": "src/tasks/index.ts",
  runner: "src/runner.ts",
};

export default defineConfig(({ watch }) => ({
  entry,
  format: ["esm"],
  outDir: "dist",
  platform: "node",
  dts: true,
  sourcemap: true,
  clean: !watch,
  treeshake: true,
  outExtensions: () => ({
    js: ".mjs",
  }),
}));
