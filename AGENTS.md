# Agents rules

> I am not a Cylon. (Gaius Baltar)

## General rules

- Only make changes in the directories explicitly specified by the user. If no specific directory is mentioned, assume changes should be confined to the most relevant directory based on the request, and confirm if unsure.
- Never commit changes unless explicitly requested by the user.
- Never delete node_modules or pnpm-lock.yaml in order to solve conflicts.

## Tech Stack

This project uses the following technologies:

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Package Manager:** pnpm
- **Runtime:** Node.js 22
- **Monorepo Tool:** Turborepo
- **Database:** PostgreSQL 18
- **ORM:** Drizzle ORM
- **Containerization:** Docker, Docker Compose
- **Styling:** Tailwindcss 4.1
- **Translations:** next-intl
- **Linting:** ESLint
- **Code Formatting:** Prettier
- **End-to-End Testing:** Playwright
- **Build Automation:** Make

## Monorepo structure

### Apps directory

- `apps/web/` - Main Next.js web application
- `packages/` - Shared packages and utilities

### Key directories in the web app

- `messages/` - Contains translation files for `next-intl`, organized by locale (e.g., `de`, `en`).
- `public/` - Stores static assets like images, fonts, and other files served directly by Next.js.
- `scripts/` - Houses utility scripts, such as database seeding scripts.
- `src/` - Core application source code.
  - `actions/` - Server actions for handling form submissions and data mutations.
  - `app/` - Next.js App Router root, containing route segments, layouts, and pages.
  - `components/` - Reusable UI components.
  - `context/` - React context providers for global state management.
  - `dal/` - Data Access Layer for interacting with the database.
  - `email/` - Email templating and sending utilities.
  - `hooks/` - Custom React hooks for encapsulating reusable logic.
  - `i18n/` - Internationalization configuration and utilities.
  - `lib/` - General utility functions and helper modules.

## Rules for running commands

- **IMPORTANT:** Use `make check` (not `pnpm run build`) to test the project and regenerate types.
- Always run `make check` after making significant changes to ensure code quality.

## Writing tasks and specs for agentic coding

- Write task list in this format:

```
## Task <number>: Description

- [ ] Task 1 ...
- [ ] Task 2....
```

- When a task is completed, mark it with `[x]`
