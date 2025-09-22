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
- Always apply `shadow-xs` class to all Shadcn UI Card components for consistent styling

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

#### Starting the Development Server

**Always check if the server is already running before starting:**

```bash
# Check if port 3000 is already in use
curl -f http://localhost:3000 > /dev/null 2>&1 && echo "Server is running" || echo "Server is not running"

# Alternative check using lsof (if available)
lsof -i :3000

# Alternative check using netstat (if available)
netstat -an | grep :3000
```

**Start the development server only if not running:**

```bash
# From the project root, start the development environment
make dev
```

**Important**: Do not start multiple instances of the dev server on the same port. Always verify the server status before attempting to start it.

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

### Playwright Testing and Debugging

#### Running Playwright Tests

**Basic Commands:**
- **Run all tests**: `pnpm --filter e2e-web exec playwright test`
- **Run tests in headed mode**: `pnpm --filter e2e-web exec playwright test --headed`
- **Run specific test file**: `pnpm --filter e2e-web exec playwright test tests/admin-users.spec.ts`
- **Run tests with debug**: `pnpm --filter e2e-web exec playwright test --debug`
- **Run tests in UI mode**: `pnpm --filter e2e-web exec playwright test --ui`

**Debugging Options:**
- **Step-by-step debugging**: Use `--debug` flag to pause execution and step through tests
- **Visual debugging**: Use `--headed` to see browser actions in real-time
- **Interactive mode**: Use `--ui` for Playwright's interactive test runner
- **Specific browser**: Add `--project=chromium` or `--project=firefox` to test specific browsers

#### Playwright MCP Integration

When using Playwright MCP for automated testing and debugging:

**Navigation and Setup:**
- Use `playwright_browser_navigate` to navigate to `http://localhost:3000`
- Use `playwright_browser_snapshot` to capture the current page state for analysis
- Use `playwright_browser_take_screenshot` for visual verification

**Form Interactions:**
- Use `playwright_browser_fill_form` for multi-field form submissions
- Use `playwright_browser_type` for single input fields
- Use `playwright_browser_click` for button clicks and navigation

**Authentication Testing:**
- Navigate to login page: `/auth/login`
- Fill credentials: `admin@example.com` / `Tester12345`
- Verify successful login by checking for dashboard elements

**Data Verification:**
- Use `playwright_browser_evaluate` to run JavaScript and extract data
- Use `playwright_browser_wait_for` to wait for specific content to appear
- Check network requests with `playwright_browser_network_requests`

**Common MCP Debugging Patterns:**
```javascript
// Take a snapshot to understand page structure
playwright_browser_snapshot()

// Navigate to a specific page
playwright_browser_navigate("http://localhost:3000/admin/users")

// Wait for page to load
playwright_browser_wait_for({text: "Users"})

// Fill a form
playwright_browser_fill_form([
  {name: "email", type: "textbox", ref: "input[name='email']", value: "test@example.com"},
  {name: "password", type: "textbox", ref: "input[name='password']", value: "password123"}
])

// Click submit button
playwright_browser_click({element: "Submit button", ref: "button[type='submit']"})

// Verify result
playwright_browser_wait_for({text: "User created successfully"})
```

#### Test Data Management

**Test Database:**
- Tests run against a separate test database
- Use the seeding scripts in `packages/e2e-web/` for test data setup
- Check `packages/e2e-web/config.ts` for test configuration

**Data Isolation:**
- Each test should clean up after itself
- Use database transactions or cleanup hooks
- Verify data state before and after tests

#### Debugging Test Failures

**Investigation Steps:**
1. **Check test output**: Look for specific error messages and stack traces
2. **Review screenshots**: Check `test-results/` directory for failure screenshots
3. **Inspect network logs**: Use `playwright_browser_network_requests` to see API calls
4. **Check console messages**: Use `playwright_browser_console_messages` for JavaScript errors
5. **Verify test data**: Ensure test database is in expected state

**Common Issues:**
- **Timing issues**: Use proper waits instead of fixed delays
- **Element not found**: Verify selectors and wait for elements to be visible
- **Authentication failures**: Ensure test user credentials are correct
- **Database state**: Check if previous tests left data in unexpected state

### Debugging Workflow for AI Agents

1. **Check if development server is running**: Use `curl -f http://localhost:3000` or `lsof -i :3000` to verify
2. **Start development server if needed**: Only if not already running - use `make dev`
3. **Check database logs**: Use `docker compose logs postgres` to view SQL queries
4. **Access the web app**: Navigate to `http://localhost:3000`
5. **Login as admin**: Use `admin@example.com` / `Tester12345`
6. **Test the feature**: Navigate to the specific functionality being debugged
7. **Run Playwright tests**: Execute relevant tests to verify functionality
8. **Inspect test failures**: Check test output and browser screenshots
9. **Verify data persistence**: Check if data is properly saved in the database
