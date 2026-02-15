# Agents rules

## General rules

- **Always use context7** when I need code generation, setup or
  configuration steps, or library/API documentation. This means
  you should automatically use the Context7 MCP tools to resolve
  library id and get library docs without me having to
  explicitly ask.
- Always run `make check` after making significant changes to ensure code quality.

## Tech Stack

This project uses the following technologies:

- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript
- **Package Manager:** pnpm
- **Runtime:** Node.js 24
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
- **CI/CD:** GitHub Actions

## Monorepo structure

### Apps directory

- `apps/analysis/` - Python-based analysis and data processing api.
- `apps/web/` - Main Next.js web application.

### Key directories in `packages/`

- `cli/` - Command-line interface utilities and admin commands.
- `database/` - Database ORM configuration, schema, and migrations.
- `e2e-web/` - End-to-end testing suite using Playwright.
- `email/` - Email template components and utilities.
- `eslint-config/` - Shared ESLint configuration.
- `prettier-config/` - Shared Prettier configuration.
- `typescript-config/` - Shared TypeScript configuration.

## Available Skills

The following skills are available in `.opencode/skills/`:

### playwright-cli

**Use when:** Automating browser interactions for web testing, form filling, screenshots, and data extraction. Use when the user needs to navigate websites, interact with web pages, fill forms, take screenshots, test web applications, or extract information from web pages.

**Tools available:** `Bash(playwright-cli:*)`

**Location:** `.opencode/skills/playwright-cli/`

**Important:** Run `make seed` before running a test to ensure that the database is seeded with the necessary test data.
