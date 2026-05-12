import { defineConfig } from "tsdown";

const entry = {
  index: "src/index.ts",
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
