import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  outDir: "dist",
  rollup: {
    esbuild: {
      treeShaking: true,
    },
  },
  clean: true,
  entries: ["./src/index.ts"],
});
