declare module "eslint-plugin-only-warn" {
  import type { ESLint } from "eslint";
  const plugin: ESLint.Plugin;
  export default plugin;
}

declare module "eslint-plugin-turbo" {
  import type { ESLint } from "eslint";
  const plugin: ESLint.Plugin;
  export default plugin;
}

declare module "eslint-plugin-playwright" {
  import type { ESLint, Linter } from "eslint";
  
  interface PlaywrightPlugin extends ESLint.Plugin {
    configs: {
      "flat/recommended": Linter.Config;
    };
  }
  
  const plugin: PlaywrightPlugin;
  export default plugin;
}
