import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  outDir: "dist",
  rollup: {
    emitCJS: true,
    esbuild: {
      treeShaking: true,
    },
  },
  declaration: true,
  clean: true,
  failOnWarn: false,
  sourcemap: true,
  entries: ["./src/clsx/index.ts"],
});
