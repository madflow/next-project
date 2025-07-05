---
trigger: always_on
---

# General rules

- Only make changes in the directories explicitly specified by the user. If no specific directory is mentioned, assume changes should be confined to the most relevant directory based on the request, and confirm if unsure.
- Never commit changes unless explicitly requested by the user.
- Never delete node_modules or package-lock.json in order to solve conflicts.
- Use functional and declarative programming patterns; avoid classes.
- Prefer iteration and modularization over code duplication.
- Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError).
- Re-use code when possible.

## Dependency management

- This project uses a monorepo with Turborepo.
- Do not install dependencies in the root directory.
- Use `npm` for package management.
- When installing dependencies for apps/web - install them in apps/web directory.
- Check the `package.json` files in each directory for dependencies, before installing them.
- Try to make use of the existing libraries and dependencies whenever possible.
- **Important**: The toast component from shadcn in deprecated. Use `sonnner` instead.
- Never install `date-fns` or any other date handling library. Use built-in date handling functions from Javascript.

## Rules for running commands

- Do not run `npm run build` in order to test the project or to regenerate types. Run `npm run lint` and `npm run check-types` instead.

