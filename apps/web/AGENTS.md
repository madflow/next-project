# Web app architecture

## General rules

- Follow Next.js patterns and use the App Router.
- Correctly determine when to use server vs. client components in Next.js.
- Use the App Router structure with `page.tsx` files in route directories.
- Client components must be explicitly marked with `'use client'` at the top of the file.
- Use kebab-case for directory names and files (e.g., `components/auth-form`).
- Prefer named exports over default exports, i.e. `export function Button() { /* ... */ }` instead of `export default function Button() { /* ... */ }`.
- Minimize `'use client'` directives:
  - Keep most components as React Server Components (RSC)
  - Only use client components when you need interactivity and wrap in `Suspense` with fallback UI
  - Create small client component wrappers around interactive elements
- Avoid unnecessary `useState` and `useEffect` when possible:
  - Use server components for data fetching
  - Use React Server Actions for form handling

## Pages

- Use Next.js App Router for routing.
- page.tsx files are always server components. Never convert them to client components.

## Creating new translations

- Use the `next-intl` package to manage translations.
- The translations files are located in the `messages` directory.
- Use `next-intl`'''s `useTranslation` hook to access translations in client components.
- Use `getTranslations` in server components.
- When adding new translation files, add them to the messages array in apps/web/src/i18n/request.ts.
- The translation keys must be added to apps/web/src/global.d.ts in order to have them available in the `useTranslation` hook.

## Naming conventions

- Use lowercase with dashes for directories (e.g., components/auth-wizard).
- Favor named exports for components.

## TypeScript Best Practices

- Use TypeScript for all code; prefer types over interfaces.
- Avoid any and enums; use explicit types and maps instead.
- Use functional components with TypeScript interfaces.
- Enable strict mode in TypeScript for better type safety.
- Do not use any.

## Styling & UI

- Use Tailwind CSS for styling.
- Use Shadcn UI for components.
- Use Tailwind utility classes directly in JSX
- Follow mobile-first responsive patterns

## Forms

- Use React Hook Form for form handling.
- Use Shadcn UI for form components.
- Use Zod for validation.

## Data Fetching

- Use TanStack Query (react-query) for frontend data fetching.

## Next.js 15 specifics

- Next.Js is used in the apps/web directory
- Use the App Router
- Use Server Components by default
- Mark client components with `'''use client'''` directive
- Implement proper loading and error states
- Use route groups `(folder)` for logical organization
- Do not use hooks in server components. Use hooks in client components. A hook starts with `use` like `useSession`.

## Authentication Patterns

- Keep auth logic in `lib/auth.ts`
- Use `useSession` hook in Client Components

## Performance Patterns

- Use `next/image` for optimized images
- Implement code splitting with `dynamic` imports
- Use `React.memo` for expensive components
- Implement proper data fetching patterns (RSC, SWR, React Query)

## Error Handling

- Implement error boundaries for client components
- Use proper error types and messages
- Handle loading and error states gracefully
- Log errors appropriately in development/production
- When throwing errors in a server action, dal action or server page, use the Exception classes from `@/lib/exceptions.ts`.
- When an Exception class is missing, create it and add it to the `@/lib/exceptions.ts` and map it to an HTTP status code.

## Debugging the Web Application

### Local Development Setup

- **Web Application URL**: `http://localhost:3000`
- **Development Server**: The Next.js development server should be running on port 3000 (not in Docker)
- **Database**: PostgreSQL runs in Docker Compose
- **Admin User Credentials**:
  - Email: `admin@example.com`
  - Password: `Tester12345`

### Database Query Debugging

- **View PostgreSQL logs**: `docker compose logs postgres`
- **Follow PostgreSQL logs in real-time**: `docker compose logs -f postgres`
- **View last 100 log lines**: `docker compose logs --tail=100 postgres`
- **View database logs with timestamps**: `docker compose logs -t postgres`

### SQL Query Analysis

When debugging database issues:

- Use `docker compose logs postgres` to view executed SQL queries
- Look for query execution times and potential slow queries
- Check for SQL errors or constraint violations in the logs
- Monitor query patterns to identify N+1 problems or inefficient queries

### Playwright Debugging

When running end-to-end tests:

- **Run tests in headed mode**: Add `--headed` flag to see browser actions
- **Debug specific test**: Use `--debug` flag to step through tests
- **View test results**: Check test output and screenshots in test results
- **Inspect network requests**: Use browser DevTools during test execution
- **Check test data**: Verify test data setup and cleanup between tests

### Debugging Workflow for AI Agents

1. **Ensure development server is running**: The Next.js app should be running on `http://localhost:3000` (not in Docker)
2. **Check database logs**: Use `docker compose logs postgres` to view SQL queries
3. **Access the web app**: Navigate to `http://localhost:3000`
4. **Login as admin**: Use `admin@example.com` / `Tester12345`
5. **Test the feature**: Navigate to the specific functionality being debugged
6. **Run Playwright tests**: Execute relevant tests to verify functionality
7. **Inspect test failures**: Check test output and browser screenshots
8. **Verify data persistence**: Check if data is properly saved in the database
