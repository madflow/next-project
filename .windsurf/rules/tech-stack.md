---
trigger: always_on
---

# Techstack

## Frameworks

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS v4.1
- **UI Components**: shadcn/ui
- **Authentication**: better-auth
- **Language**: TypeScript
- **NodeJs**: 22
- **Package Manager**: npm
- **Orm**: Drizzle
- **Monorepo**: Turborepo
- **next-intl**: next-intl for translations

## Dependency management

- This project uses a monorepo with Turborepo.
- Do not install dependencies in the root directory.
- Use `npm` for package management.
- When installing dependencies for apps/web - install them in apps/web directory.
- Check the `package.json` files in each directory for dependencies, before installing them.
- Try to make use of the existing libraries and dependencies whenever possible.
- **Important**: The toast component from shadcn in deprecated. Use `sonnner` instead.
- Never install `date-fns` or any other date handling library. Use built-in date handling functions from Javascript.

## Code Generation Guidelines

### Component Structure

- Prefer composition over complex prop drilling
- Keep components small and focused on a single responsibility
- Use TypeScript interfaces for component props

### Type Safety

- Always define types for function parameters and return values
- Use `interface` for component props and public APIs
- Leverage TypeScript's utility types (e.g., `Pick`, `Omit`, `Partial`)
- Create and reuse type definitions in `types/` directory

### Next.js 15 specifics

- Next.Js is used in the apps/web directory
- Use the App Router
- Use Server Components by default
- Mark client components with `'use client'` directive
- Implement proper loading and error states
- Use route groups `(folder)` for logical organization
- Do not use hooks in server components. Use hooks in client components. A hook starts with `use` like `useSession`.

### Styling with Tailwind CSS v4.1

- Use Tailwind utility classes directly in JSX
- Follow mobile-first responsive patterns
- Use `@layer` for custom styles in `globals.css`
- Define design tokens in `tailwind.config.js`

### Authentication Patterns

- Keep auth logic in `lib/auth.ts`
- Use `useSession` hook in Client Components

### Performance Patterns

- Use `next/image` for optimized images
- Implement code splitting with `dynamic` imports
- Use `React.memo` for expensive components
- Implement proper data fetching patterns (RSC, SWR, React Query)

### Error Handling

- Implement error boundaries for client components
- Use proper error types and messages
- Handle loading and error states gracefully
- Log errors appropriately in development/production

### Testing

- Write unit tests for business logic
- Test component rendering and interactions
- Mock external dependencies
- Test authentication flows

### Documentation

- Use JSDoc for functions and components
- Document complex business logic
- Include examples for component usage
- Document edge cases and limitations
