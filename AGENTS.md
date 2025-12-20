# Agents rules

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

## Monorepo structure

### Apps directory

- `apps/analysis/` - Python-based analysis and data processing api.
- `apps/web/` - Main Next.js web application.

### Key directories in `apps/analysis/`

- `analysis/` - Core analysis module.
  - `db/` - Database models and ORM configurations.
  - `services/` - Business logic and data processing services.
  - `tests/` - Unit and integration tests.
  - `web/` - Web utilities and API integrations.
- `sandbox/` - Experimental code and prototyping.
- `scripts/` - Utility scripts for maintenance and administration.

### Key directories in `apps/web/`

- `messages/` - Contains translation files for `next-intl`, organized by locale (e.g., `de`, `en`).
- `public/` - Stores static assets like images, fonts, and other files served directly by Next.js.
- `scripts/` - Houses utility scripts, such as database seeding scripts.
- `src/` - Core application source code.
  - `actions/` - Server actions for handling form submissions and data mutations.
  - `app/` - Next.js App Router root, containing route segments, layouts, and pages.
  - `components/` - Reusable UI components.
  - `context/` - React context providers for global state management.
  - `dal/` - Data Access Layer for interacting with the database.
  - `hooks/` - Custom React hooks for encapsulating reusable logic.
  - `i18n/` - Internationalization configuration and utilities.
  - `lib/` - General utility functions and helper modules.

### Key directories in `packages/`

- `cli/` - Command-line interface utilities and admin commands.
- `database/` - Database ORM configuration, schema, and migrations.
- `e2e-web/` - End-to-end testing suite using Playwright.
- `email/` - Email template components and utilities.
- `eslint-config/` - Shared ESLint configuration.
- `prettier-config/` - Shared Prettier configuration.
- `typescript-config/` - Shared TypeScript configuration.

## Rules for confirming changes

- Always run `make check` after making significant changes to ensure code quality.
