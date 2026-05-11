import { defineConfig } from "tsdown";

export default defineConfig(({ watch }) => ({
  entry: {
    index: "src/index.ts",
  },
  format: ["esm"],
  outDir: "dist",
  platform: "node",
  dts: false,
  clean: !watch,
  treeshake: true,
  outExtensions: () => ({
    js: ".mjs",
  }),
}));
