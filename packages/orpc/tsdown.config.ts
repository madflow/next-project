import { defineConfig } from "tsdown";

const entry = {
  "client/index": "src/client/index.ts",
  "server/index": "src/server/index.ts",
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
