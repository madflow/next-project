# Migration Plan: Move e2e tests to `packages/e2e-web`

This document outlines the steps to migrate the existing Playwright end-to-end tests from the `e2e/` directory to a new Turborepo package located at `packages/e2e-web/`.

## Goal

To consolidate e2e tests into a dedicated Turborepo package, improving organization and leveraging Turborepo's caching and task orchestration.

## Steps

1.  **Create New Package Directory:**
    *   Create the directory `packages/e2e-web`.

2.  **Move Existing Files:**
    *   Move all files and directories from `e2e/` to `packages/e2e-web/`. This includes:
        *   `config.ts`
        *   `eslint.config.mjs`
        *   `package-lock.json` (if present and needed, otherwise `npm install` will regenerate)
        *   `package.json`
        *   `playwright.config.ts`
        *   `utils.ts`
        *   `tests/` directory
        *   `.gitignore`

3.  **Update `packages/e2e-web/package.json`:**
    *   Update the `name` field to reflect the new package name (e.g., `"@repo/e2e-web"`).
    *   Review and update any internal paths within scripts or configurations to reflect the new location.
    *   Add `workspace:*` dependencies for any internal packages it relies on (e.g., `@repo/typescript-config`, `@repo/eslint-config`).

4.  **Update Root `package.json`:**
    *   Add `"packages/e2e-web"` to the `workspaces` array in the root `package.json`.

5.  **Update Turborepo Configuration (`turbo.json`):**
    *   Add a new pipeline entry for the `e2e-web` package. For example:
        ```json
        "e2e-web#test": {
          "dependsOn": ["^build"],
          "outputs": ["test-results/**", ".next/**"]
        }
        ```
        (Adjust `dependsOn` and `outputs` based on your specific needs).

6.  **Update CI/CD Workflows:**
    *   Modify `.github/workflows/playwright.yml` to:
        *   Reference the new package path (`packages/e2e-web`).
        *   Use the new Turborepo task (e.g., `npm run test:e2e` if you define a script in `e2e-web/package.json` that calls `playwright test`, or directly `turbo run e2e-web#test`).

7.  **Remove Old `e2e/` Directory:**
    *   Once all files are moved and verified, remove the original `e2e/` directory.

8.  **Verify Installation and Functionality:**
    *   Run `npm install` (or `npm ci`) from the root of the monorepo to ensure all dependencies are correctly linked.
    *   Execute the Playwright tests using the new Turborepo command (e.g., `npm run test:e2e` or `turbo run e2e-web#test`) to confirm everything is working as expected.
    *   Run `npm run lint` and `npm run check-types` to ensure no new errors are introduced.
