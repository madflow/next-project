import { defineConfig } from "tsdown";

const entry = {
  "clients/index": "src/clients/index.ts",
  "schema/index": "src/schema/index.ts",
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
