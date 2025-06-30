# Agents rules

> I am not a Cylon.

## General rules

- Only make changes in the directories explicitly specified by the user. If no specific directory is mentioned, assume changes should be confined to the most relevant directory based on the request, and confirm if unsure.
- Never commit changes unless explicitly requested by the user.

## Tech Stack

This project uses the following technologies:

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Package Manager:** npm
- **Runtime:** Node.js 22
- **Monorepo Tool:** Turborepo
- **Database:** PostgreSQL 17
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

## Web app architecture (apps/web)

### General rules

- Follow Next.js patterns and use the App Router.
- Correctly determine when to use server vs. client components in Next.js.
- Use functional and declarative programming patterns; avoid classes.
- Prefer iteration and modularization over code duplication.
- Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError).
- Re-use code when possible.

### Naming conventions

- Use lowercase with dashes for directories (e.g., components/auth-wizard).
- Favor named exports for components.

### TypeScript Best Practices

- Use TypeScript for all code; prefer types over interfaces.
- Avoid any and enums; use explicit types and maps instead.
- Use functional components with TypeScript interfaces.
- Enable strict mode in TypeScript for better type safety.
- Do not use any.

### Styling & UI

- Use Tailwind CSS for styling.
- Use Shadcn UI for components.

### Data fetching & forms

- Use TanStack Query (react-query) for frontend data fetching.
- Use React Hook Form for form handling.
- Use Zod for validation.

## Rules for running commands

- Do not run `npm run build` in order to test the project. Run `npm run lint` and `npm run check-types` instead.
