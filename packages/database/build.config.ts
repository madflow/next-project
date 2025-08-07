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
  externals: ["drizzle-orm", "drizzle-zod", "zod"],
  entries: ["./src/schema/index.ts", "./src/clients/index.ts"],
});
