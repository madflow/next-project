# Codebase Improvements

A comprehensive list of improvements identified across code organization, quality, security, and testability.

---

## Table of Contents

- [Code Organization](#code-organization)
- [Code Quality](#code-quality)
- [Security](#security)
- [Testability](#testability)

---

## Code Organization

### High Priority

- [ ] **Consolidate duplicate client files in database package**
  - Files: `packages/database/src/clients/default.ts`, `packages/database/src/clients/admin.ts`
  - Issue: Both files are 100% identical but should have different connection strings
  - Fix: Create separate admin connection using `DATABASE_ADMIN_URL`

- [x] **Create authorization wrapper for server actions**
  - Files: `apps/web/src/actions/dataset.ts` (lines 27-37, 68-78, 90-100, 118-128)
  - Issue: Same auth+session check code is copy-pasted 4+ times
  - Fix: Create `withAdminAuth()` wrapper in `src/lib/server-action-utils.ts`

- [ ] **Extract common data fetching hooks**
  - Files: `apps/web/src/hooks/use-organizations.ts`, `use-projects-by-org.ts`, `use-datasets-by-project.ts`
  - Issue: Nearly identical structure with slight differences
  - Fix: Create generic `createEntityListHook<T>()` factory function

- [ ] **Create generic EntitySelect component**
  - Files: `apps/web/src/components/form/organization-select.tsx`, `project-select.tsx`, `dataset-select.tsx`
  - Issue: 80%+ identical structure across components
  - Fix: Create `EntitySelect<T>` component with shared implementation

- [ ] **Split large component files**
  - Files: `apps/web/src/components/chart/adhoc-chart.tsx` (533 lines)
  - Fix: Split into `AdhocChartCard.tsx`, `ChartTypeSelector.tsx`, `ChartRenderer.tsx`, `DebugTabs.tsx`

- [ ] **Refactor complex Python function**
  - File: `apps/analysis/analysis/services/stats.py` (lines 341-544)
  - Issue: `_calculate_single_var_stats` is 200+ lines with high cyclomatic complexity
  - Fix: Split into `_calculate_general_stats()`, `_calculate_numeric_stats()`, `_calculate_frequency_table()`

### Medium Priority

- [ ] **Move form schemas to shared location**
  - Files: `apps/web/src/components/admin/project/create-project-form.tsx`, `edit-project-form.tsx`, etc.
  - Fix: Create `src/schemas/project.ts`, `src/schemas/organization.ts`

- [x] **Fix Project type duplication**
  - Files: `apps/web/src/context/app-context.tsx` (lines 9-14), `src/hooks/use-active-project.ts` (lines 7-12)
  - Fix: Import from `src/types/project.ts` which re-exports from database package

- [ ] **Organize e2e tests into subdirectories**
  - Current: Flat structure with prefix naming (`admin-*`, `api-*`, `auth-*`)
  - Fix: Create `tests/admin/`, `tests/api/`, `tests/auth/`, `tests/adhoc/`

- [x] **Extract S3 download logic in Python**
  - File: `apps/analysis/analysis/web/api/datasets/routes.py` (lines 99-171)
  - Issue: `_read_sav_from_s3` and `_read_dataframe_from_s3` share identical S3 download code
  - Fix: Create `@contextmanager _download_sav_from_s3()` helper

- [ ] **Split large schema files**
  - Files: `packages/database/src/schema/auth.ts` (211 lines), `app.ts` (298 lines)
  - Fix: Split into domain-specific files: `schema/auth/user.ts`, `schema/auth/session.ts`, etc.

### Low Priority

- [x] **Inconsistent callback naming in components**
  - Files: `organization-select.tsx` (`onValueChangeAction`), `project-select.tsx` (`onValueChange`)
  - Fix: Use consistent naming across all select components

- [x] **Add docstrings to empty Python **init** files**
  - File: `apps/analysis/analysis/web/api/datasets/__init__.py`
  - Fix: Add `"""Dataset API routes and endpoints."""`

---

## Code Quality

### High Priority

- [x] **Replace explicit `any` types with proper types**
  - Files affected:
    - `apps/web/src/components/admin/project/create-project-form.tsx` (line 19-20)
    - `apps/web/src/components/admin/dataset/upload-form.tsx` (line 110-111)
    - `apps/web/src/components/app-sidebar.tsx` (line 17-18)
    - `apps/web/src/lib/dal-joins.ts` (lines 10-11, 192-193)
  - Fix: Create `TranslationFunction` type for i18n translation functions

- [ ] **Fix session management in Python**
  - File: `apps/analysis/analysis/db/dependencies.py` (lines 16-20)
  - Issue: Session commits even on exceptions, could persist invalid data
  - Fix: Move `commit()` before `finally`, add rollback on exception

- [ ] **Fix docstring placement in Python**
  - File: `apps/analysis/analysis/web/application.py` (lines 12-28)
  - Issue: Docstring is placed AFTER code execution
  - Fix: Move docstring immediately after function definition

- [ ] **Add environment validation in database package**
  - File: `packages/database/src/env.ts`
  - Issue: `DATABASE_URL` could be undefined, causing cryptic runtime errors
  - Fix: Add validation with descriptive error message

- [x] **Fix orphaned migration file**
  - File: `packages/database/migrations/0008_update_allowed_statistics_to_boolean_map.sql`
  - Issue: Not tracked in `_journal.json`, won't be run by Drizzle migrator
  - Resolution: Deleted file - migration logic superseded by tracked migration `0010_clumsy_bushwacker.sql`

### Medium Priority

- [x] **Add connection pool configuration**
  - File: `packages/database/src/clients/default.ts`
  - Issue: Uses default pool settings
  - Fix: Configure `max`, `idleTimeoutMillis`, `connectionTimeoutMillis`

- [x] **Define Drizzle relations**
  - File: `packages/database/src/schema/index.ts`
  - Issue: No relations defined, can't use relational query builder
  - Fix: Add `userRelations`, `sessionRelations`, etc. using `relations()`

- [x] **Pass schema to Drizzle client**
  - Files: `packages/database/src/clients/default.ts`, `admin.ts`
  - Issue: Schema not passed, can't use `db.query.*`
  - Fix: `const client = drizzle({ client: pool, schema })`

- [ ] **Fix inconsistent timestamp handling**
  - File: `packages/database/src/schema/auth.ts`
  - Issue: Some timestamps have `withTimezone: true`, others don't
  - Fix: Ensure all timestamps consistently use `withTimezone: true`

- [ ] **Standardize Python type hints**
  - File: `apps/analysis/analysis/services/stats.py`
  - Issue: Mixes old-style (`List`, `Dict`) with modern (`list`, `dict`)
  - Fix: Use consistent Python 3.10+ style lowercase generics

- [ ] **Add graceful pool shutdown**
  - File: `packages/database/src/clients/default.ts`
  - Fix: Export `shutdown()` function that calls `pool.end()`

### Low Priority

- [ ] **Remove unused imports in tests**
  - File: `apps/analysis/analysis/tests/web/test_routes.py` (line 1: `import json`)

- [ ] **Fix unused `isPending` variable**
  - File: `apps/web/src/components/admin/dataset/upload-form.tsx` (line 64)

- [ ] **Replace console.error with logging utility**
  - Files: Multiple (upload-form.tsx, create-project-form.tsx, dal/dataset.ts)
  - Fix: Create `src/lib/logger.ts` with structured logging

- [ ] **Fix package.json export types**
  - File: `packages/database/package.json` (lines 22-23, 32-33)
  - Issue: `type` should be `types` with `.d.cts` extension

- [ ] **Consider Result types over exceptions**
  - File: `apps/web/src/dal/user.ts` uses discriminated union pattern
  - Suggestion: Extend this pattern to other DAL functions

---

## Security

### Critical (Fix Immediately)

- [x] **Enable rate limiting**
  - File: `apps/web/src/lib/auth.ts` (lines 124-144)
  - Implementation: Global config (2000 req/min, 60s window, DB-backed) with custom route rules
    - `/sign-in/email`: 400 req/min (e2e test compatibility)
    - `/sign-up/email`: 10 req/min (prevent account automation)
    - `/reset-password/email`: 10 req/min (prevent email spam)

- [ ] **Require secrets in production**
  - File: `apps/web/src/env.ts` (lines 11-26)
  - Issue: `AUTH_SECRET: z.string().default("")` allows empty secrets
  - Fix: `AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters")`

- [x] **Await assertUserIsAdmin() calls**
  - File: `apps/web/src/actions/user.ts` (line 16)
  - Issue: `assertUserIsAdmin()` not awaited, potentially bypassed auth
  - Fix: Add `await` before all `assertUserIsAdmin()` calls

- [ ] **Remove hardcoded default API key**
  - File: `apps/analysis/analysis/settings.py` (line 73)
  - Issue: `api_key: str = "your-super-secret-api-key"`
  - Fix: Remove default or add validator to reject default value

### High Priority

- [ ] **Add authorization to server actions**
  - Files: `apps/web/src/actions/dataset-variable.ts`, `dataset-variableset.ts`, `dataset-splitvariable.ts`
  - Issue: Actions don't have explicit auth checks
  - Fix: Add `assertUserIsAdmin()` or session checks

- [ ] **Enable TLS for S3 in production**
  - File: `apps/web/src/lib/storage.ts` (line 18)
  - Issue: `tls: false` - unencrypted S3 communication

- [x] **Add non-root users to Docker containers**
  - Files: `apps/analysis/Dockerfile`, `packages/cli/Dockerfile`, `packages/database/Dockerfile`
  - Issue: Containers run as root
  - Fix: Add `RUN addgroup/adduser` and `USER` directive

- [ ] **Add validation to JSON.parse**
  - File: `apps/web/src/actions/dataset.ts` (line 54)
  - Issue: `JSON.parse(missingValuesJson)` could throw, no schema validation
  - Fix: Wrap in try-catch with Zod schema validation

- [ ] **Remove development secrets from docker-compose**
  - File: `docker-compose.yml` (lines 7-22)
  - Issue: Hardcoded `AUTH_SECRET=super-secret-key`, `ANALYSIS_API_KEY=secret`
  - Fix: Use environment variables or secrets management

### Medium Priority

- [ ] **Sanitize LIKE query inputs**
  - File: `apps/web/src/dal/dataset-variableset.ts` (line 126)
  - Issue: `%${search}%` could cause issues with special LIKE characters
  - Fix: Escape special characters (`%`, `_`, `\`)

- [ ] **Secure file extension extraction**
  - Files: `apps/web/src/lib/storage.ts` (line 41), `src/actions/avatar.ts` (line 51)
  - Issue: Uses `.split(".").pop()` on user-provided filename
  - Fix: Validate against whitelist of allowed extensions

- [ ] **Fix health check HTTP status codes**
  - File: `apps/analysis/analysis/web/api/health.py` (lines 87-119)
  - Issue: Status code calculated but always returns 200 OK
  - Fix: Use `response.status_code = status_code`

- [ ] **Review Sentry PII settings**
  - File: `apps/analysis/analysis/web/application.py` (line 19)
  - Issue: `send_default_pii=True` may expose sensitive user data

- [ ] **Disable insecure SMTP auth**
  - File: `docker-compose.yml` (lines 127-128)
  - Issue: `MP_SMTP_AUTH_ALLOW_INSECURE: 1`

### Low Priority

- [ ] **Validate dangerouslySetInnerHTML input**
  - File: `apps/web/src/components/ui/chart.tsx` (line 109)
  - Issue: Used for CSS injection from organization settings

- [ ] **Review avatar public-read ACL**
  - File: `apps/web/src/actions/avatar.ts` (line 62)
  - Consider: Whether all avatars should be publicly accessible

---

## Testability

### High Priority

- [ ] **Create API test factory to eliminate duplication**
  - Files: `api-access-datasets.spec.ts`, `api-access-organizations.spec.ts`, `api-access-projects.spec.ts`
  - Issue: ~80-90% duplicate code across 1000+ lines
  - Fix: Create `utils/api-test-factory.ts` with shared patterns

- [ ] **Create authentication fixtures**
  - Files: All test files repeat login boilerplate
  - Fix: Create `fixtures/auth.fixture.ts` with `adminPage` and `userPage` fixtures

- [x] **Replace hardcoded waits with explicit waits**
  - Files:
    - `user-account.spec.ts` (line 40): `waitForTimeout(1000)`
    - `adhoc-analysis-basic.spec.ts` (lines 30, 50, 81): various timeouts
    - `organization-invite-users.spec.ts` (line 24): `waitForTimeout(250)`
  - Fix: Use `waitForLoadState("networkidle")` or `expect().toBeVisible()`

- [ ] **Add error boundaries to complex components**
  - Files: `apps/web/src/components/project/adhoc-analysis.tsx`, `chart/adhoc-chart.tsx`
  - Issue: No error boundaries, failures crash entire UI
  - Fix: Create and wrap with `ErrorBoundary` component

### Medium Priority

- [ ] **Implement Page Object Model for e2e tests**
  - Current: UI interaction code duplicated across admin tests
  - Fix: Create `page-objects/admin-users.page.ts`, `admin-organizations.page.ts`, etc.

- [ ] **Add global setup/teardown for e2e tests**
  - File: `packages/e2e-web/playwright.config.ts`
  - Fix: Add `globalSetup` for database seeding and environment validation

- [ ] **Add database integration tests for Python**
  - Current: `apps/analysis/analysis/tests/` has no DB tests
  - Fix: Add `tests/db/test_dependencies.py` with session management tests

- [ ] **Add S3 client tests**
  - File: `apps/analysis/analysis/services/s3_client.py`
  - Fix: Add `tests/services/test_s3_client.py` with mocked S3

- [ ] **Standardize test.describe.configure placement**
  - Issue: Inconsistent configuration across test files
  - Fix: Place at top of file before `test.describe` blocks

### Low Priority

- [ ] **Add test tagging for selective runs**
  - Fix: Add tags like `@smoke`, `@regression`, `@slow`

- [ ] **Add accessibility testing**
  - Fix: Integrate `@axe-core/playwright` for a11y tests

- [ ] **Add mobile viewport tests**
  - Note: Currently commented out in playwright.config.ts

- [ ] **Add missing test scenarios**
  - Dataset upload failures (invalid file types, oversized files)
  - Form validation (required fields, email format)
  - Session expiry handling
  - Pagination edge cases (last page, empty results)

---

## Summary by Priority

| Priority  | Count  | Categories                                   |
| --------- | ------ | -------------------------------------------- |
| Critical  | 4      | Security                                     |
| High      | 22     | Organization, Quality, Security, Testability |
| Medium    | 18     | Organization, Quality, Security, Testability |
| Low       | 11     | Organization, Quality, Security, Testability |
| **Total** | **55** |                                              |

---

## Suggested Implementation Order

1. **Week 1: Security Critical**
   - Enable rate limiting
   - Require secrets in production
   - Fix assertUserIsAdmin await
   - Add authorization to actions

2. **Week 2: Code Quality Critical**
   - Fix session management in Python
   - Add environment validation
   - Replace `any` types with proper types

3. **Week 3: Organization**
   - Create authorization wrapper
   - Extract common hooks and components
   - Consolidate database clients

4. **Week 4: Testing**
   - Create API test factory
   - Create auth fixtures
   - Replace hardcoded waits

5. **Ongoing**
   - Address medium and low priority items
   - Add missing tests as features change
