# API Migration Checklist

This document tracks the remaining migration work from `apps/web/src/app/api-old` to the current `/api` surface.

Migration is complete when:

- no active endpoint is served from `apps/web/src/app/api-old`
- no production code imports `@/app/api-old/*`
- each public `/api/...` endpoint is implemented either through `packages/api` or through an explicit `apps/web/src/app/api/.../route.ts` wrapper
- callers and tests point at the migrated implementation
- `make check` passes

## Status Legend

- `[ ]` not started
- `[-]` in progress
- `[x]` done
- `blocked:` short reason if the task cannot move forward

## How To Work On A Task

1. Pick exactly one task from this file and mark it `[-]`.
2. Read the matching old route implementation under `apps/web/src/app/api-old/**`.
3. Read the active callers and tests before changing code.
4. Choose the implementation target:
   - use `packages/api` for JSON resource and collection endpoints
   - use `apps/web/src/app/api/.../route.ts` for S3 downloads, binary responses, multipart form handling, or analysis-service proxy routes
5. Keep the public `/api/...` path stable unless the same task updates every caller and every test.
6. Remove the matching `api-old` route in the same task once the replacement passes.
7. Run focused validation for that task, then run `make check`.
8. Mark the task `[x]` and leave a short resume note describing what landed.

## Working Context

- Public API entrypoint: `apps/web/src/app/api/[[...rest]]/route.ts`
- Current package handler: `packages/api/src/server/rest/create-openapi-handler.ts`
- Package contract wiring: `packages/api/src/shared/contract/app.ts`
- Package router wiring: `packages/api/src/server/router.ts`
- Old endpoints to remove: `apps/web/src/app/api-old/**`
- End-to-end API tests: `packages/e2e-web/tests/api/**`

Important implementation rule:

- Finishing the migration does not require forcing every endpoint into `packages/api`.
- If an endpoint is a thin runtime-specific wrapper around S3, file streaming, multipart form data, or `createAnalysisClient()`, it is acceptable to migrate it to `apps/web/src/app/api/...` and delete the old `api-old` version.
- If an endpoint is a normal JSON CRUD or collection endpoint, prefer `packages/api`.

Important isolation rule:

- Each task below is designed to land independently.
- If a task needs shared scaffolding that does not exist yet, create the minimum needed in that task instead of waiting for another task.
- Do not widen the task to unrelated endpoint families.

## Shared Validation

Run the smallest useful checks first, then run the full repo check.

Suggested commands:

```bash
pnpm --filter @repo/api test
pnpm --filter e2e-web exec playwright test tests/api/<relevant-spec>.spec.ts
make check
```

Use Context7 when you need oRPC, OpenAPI handler, or Next.js route handler documentation while implementing a task.

## Progress Tracker

| Task                                              | Status | Last touched | Notes                                                                                                                                                              |
| ------------------------------------------------- | ------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. Extract `processUrlParams` from `api-old`      | [x]    | 2026-05-24   | Helper and unit test moved into `apps/web/src/app/api`; `api-old/handler.ts` removed and imports repointed.                                                        |
| 2. Migrate user avatar endpoint                   | [ ]    |              |                                                                                                                                                                    |
| 3. Migrate variableset read endpoints             | [x]    | 2026-05-24   | Added `packages/api` variableset read routes, removed the matching `api-old` files, and kept `/api` callers green.                                                 |
| 4. Migrate variableset write endpoints            | [x]    | 2026-05-24   | Removed the last `api-old` variableset mutation files after validating the `/api/variablesets/...` wrappers.                                                       |
| 5. Migrate dataset variable-assignment endpoints  | [x]    | 2026-05-24   | Added `unassigned` and splitvariable mutation routes in `packages/api`, removed the matching `api-old` files, and revalidated the API/admin flows after reseeding. |
| 6. Migrate dataset download endpoint              | [x]    | 2026-05-24   | Added an `app/api` dataset download route, aligned access checks with the active `/api` auth model, and removed the matching `api-old` handler.                    |
| 7. Migrate dataset analysis proxy endpoints       | [x]    | 2026-05-24   | Added `app/api` raw-data and stats proxy routes, removed the matching `api-old` handlers, and revalidated the analysis API specs.                                  |
| 8. Migrate dataset export proxy endpoints         | [x]    | 2026-05-24   | Added `app/api` Excel and PowerPoint export proxy routes, removed the matching `api-old` handlers, and revalidated the API/UI export flows.                        |
| 9. Migrate dataset variableset transfer endpoints | [x]    | 2026-05-24   | Added `app/api` variableset export/import routes, removed the matching `api-old` handlers, and revalidated the API/admin transfer flows.                           |

## Recommended Order

1. Task 1
2. Task 3
3. Task 4
4. Task 5
5. Task 6
6. Task 7
7. Task 8
8. Task 9
9. Task 2

This order reduces shared churn around variableset resources and removes the last production dependency on `api-old` helpers early.

## Task 1: Extract `processUrlParams` From `api-old`

Status: `[x]`

Goal:

- remove the remaining shared helper dependency on `apps/web/src/app/api-old/handler.ts`

Current files:

- `apps/web/src/app/api-old/handler.ts`
- `apps/web/src/app/api-old/handler.test.ts`
- `apps/web/src/app/api/handler.ts`

Implementation guidance:

- move the helper and its tests to a neutral location that is not under `api-old`
- keep behavior stable for the remaining non-migrated routes
- acceptable targets include `apps/web/src/app/api/handler.ts` plus a moved test, or a small utility under `apps/web/src/lib/**`

Acceptance criteria:

- no production import references `@/app/api-old/handler`
- the helper test still exists and passes from its new location
- `apps/web/src/app/api-old/handler.ts` is removed
- route behavior for pagination, ordering, reserved params, and invalid input remains unchanged

Focused validation:

- run the moved unit test for `processUrlParams`
- run `make check`

Resume notes:

- owner: OpenCode
- last change: Moved `processUrlParams` and its unit test into `apps/web/src/app/api`, repointed all remaining imports, and removed the `api-old` helper module.
- follow-ups: none.

## Task 2: Migrate User Avatar Endpoint

Status: `[x]`

Goal:

- replace the old avatar file-serving route and keep the public path stable

Public endpoint:

- `GET /api/users/:id/avatars/:file`

Current files:

- old route: `apps/web/src/app/api-old/users/[id]/avatars/[file]/route.ts`
- callers: `apps/web/src/components/nav-user.tsx`, `apps/web/src/components/account/avatar-upload.tsx`
- tests: `packages/e2e-web/tests/api/api-access-user-avatar.spec.ts`

Implementation guidance:

- recommended target is `apps/web/src/app/api/users/[id]/avatars/[file]/route.ts`
- preserve current auth behavior: self or admin can access the avatar
- preserve binary response headers and caching semantics unless a deliberate change is needed

Acceptance criteria:

- the public avatar URL still works without caller changes
- unauthorized, forbidden, missing-file, and success cases match current behavior
- the matching `api-old` route is removed
- avatar UI and the e2e API spec continue to pass

Focused validation:

- `pnpm --filter e2e-web exec playwright test tests/api/api-access-user-avatar.spec.ts`
- `make check`

Resume notes:

- owner: OpenCode
- last change: Added a `variableset` package resource for the read endpoints, removed the matching `api-old` read files, and added `/api` wrappers so the remaining write endpoints stayed stable.
- follow-ups: none.

## Task 3: Migrate Variableset Read Endpoints

Status: `[-]`

Goal:

- migrate the read-only variableset routes that are still served from `api-old`

Public endpoints:

- `GET /api/variablesets/:id/variables`
- `GET /api/variablesets/:id/contents`
- `GET /api/datasets/:datasetId/variablesets/:setId/variables`

Current files:

- old routes:
  - `apps/web/src/app/api-old/variablesets/[id]/variables/route.ts`
  - `apps/web/src/app/api-old/variablesets/[id]/contents/route.ts`
  - `apps/web/src/app/api-old/datasets/[id]/variablesets/[setId]/variables/route.ts`
- callers:
  - `apps/web/src/hooks/use-variableset-variables.ts`
  - `apps/web/src/hooks/use-variableset-contents.ts`
  - `apps/web/src/components/project/adhoc-analysis.tsx`
  - `apps/web/src/components/project/adhoc-variableset-selector.tsx`
- tests:
  - `packages/e2e-web/tests/api/api-access-variablesets-by-id.spec.ts`

Implementation guidance:

- preferred target is `packages/api`
- if this task lands before Task 4, create the minimum shared `variableset` resource scaffolding needed for read operations
- keep response shapes compatible with current hooks and tests unless the same task updates those consumers
- preserve dataset-to-variableset access checks for the dataset-scoped route

Acceptance criteria:

- all three read endpoints are no longer served from `api-old`
- current hooks and project UI continue to work with the migrated implementation
- access control and not-found behavior match current expectations
- the matching old route files are removed
- the relevant e2e spec passes

Focused validation:

- `pnpm --filter e2e-web exec playwright test tests/api/api-access-variablesets-by-id.spec.ts`
- any new `@repo/api` tests added for the route family
- `make check`

Resume notes:

- owner: OpenCode
- last change: Removed the remaining `api-old` variableset mutation files after the `/api/variablesets/...` handlers were in place.
- follow-ups: Run the focused variableset API spec and `make check`, then finalize the task status.

## Task 4: Migrate Variableset Write Endpoints

Status: `[x]`

Goal:

- migrate the variableset mutation routes that are still served from `api-old`

Public endpoints:

- `DELETE /api/variablesets/:id`
- `POST /api/variablesets/:id/contents`
- `DELETE /api/variablesets/:id/contents`
- `PUT /api/variablesets/:id/contents/reorder`

Current files:

- old routes:
  - `apps/web/src/app/api-old/variablesets/[id]/route.ts`
  - `apps/web/src/app/api-old/variablesets/[id]/contents/route.ts`
  - `apps/web/src/app/api-old/variablesets/[id]/contents/reorder/route.ts`
- tests:
  - `packages/e2e-web/tests/api/api-access-variablesets-by-id.spec.ts`

Implementation guidance:

- preferred target is `packages/api`
- if Task 3 has not landed yet, create the minimum shared `variableset` resource scaffolding here
- preserve the current request validation rules for content creation, deletion, and reorder operations
- keep admin-only semantics where they currently exist

Acceptance criteria:

- all four mutation endpoints are no longer served from `api-old`
- validation behavior still covers missing fields, duplicate `contentIds`, and mismatched reorder lists
- success responses remain compatible with current callers and tests
- the matching old route files are removed
- the relevant e2e spec passes

Focused validation:

- `pnpm --filter e2e-web exec playwright test tests/api/api-access-variablesets-by-id.spec.ts`
- any new `@repo/api` tests added for write operations
- `make check`

Resume notes:

- owner: OpenCode
- last change: Removed the last `api-old` variableset mutation files after validating the `/api/variablesets/...` wrappers.
- follow-ups: none.

## Task 5: Migrate Dataset Variable-Assignment Endpoints

Status: `[x]`

Goal:

- migrate the dataset endpoints used by variable assignment and split-variable management

Public endpoints:

- `GET /api/datasets/:id/variables/unassigned`
- `POST /api/datasets/:id/splitvariables/:variableId`
- `DELETE /api/datasets/:id/splitvariables/:variableId`

Current files:

- old routes:
  - `apps/web/src/app/api-old/datasets/[id]/variables/unassigned/route.ts`
  - `apps/web/src/app/api-old/datasets/[id]/splitvariables/[variableId]/route.ts`
- callers:
  - `apps/web/src/components/admin/dataset-variableset/variable-assignment.tsx`
- tests:
  - `packages/e2e-web/tests/api/api-access-dataset-resources.spec.ts`
  - `packages/e2e-web/tests/admin-dataset-variable-sets.spec.ts`

Implementation guidance:

- preferred target is `packages/api`
- keep the existing collection behavior for unassigned variables
- preserve dataset access checks before mutating split variables
- add only the minimum new contract and procedure surface needed for this route family

Acceptance criteria:

- the assignment UI can still load unassigned variables and assign or unassign split variables
- access control and not-found handling stay consistent
- the matching old route files are removed
- targeted e2e specs pass

Focused validation:

- `pnpm --filter e2e-web exec playwright test tests/api/api-access-dataset-resources.spec.ts`
- `pnpm --filter e2e-web exec playwright test tests/admin-dataset-variable-sets.spec.ts`
- any new `@repo/api` tests for this route family
- `make check`

Resume notes:

- owner: OpenCode
- last change: Added dataset `variables/unassigned` and splitvariable POST/DELETE routes to `packages/api`, removed the matching `api-old` routes, reseeded local data, and revalidated the Task 5 API/admin specs.
- follow-ups: none.

## Task 6: Migrate Dataset Download Endpoint

Status: `[x]`

Goal:

- migrate the dataset file download route without changing the public URL

Public endpoint:

- `GET /api/datasets/:id/download`

Current files:

- old route: `apps/web/src/app/api-old/datasets/[id]/download/route.ts`
- callers: `apps/web/src/components/admin/dataset/columns.tsx`
- tests: `packages/e2e-web/tests/api/api-access-dataset-resources.spec.ts`

Implementation guidance:

- recommended target is `apps/web/src/app/api/datasets/[id]/download/route.ts`
- keep this as a thin Next route unless there is a strong reason to move binary file handling into `packages/api`
- preserve access checks, content type, content disposition, and cache headers

Acceptance criteria:

- dataset downloads still work from the admin UI
- missing dataset and unauthorized access behave as before
- the matching `api-old` route is removed
- the relevant e2e API spec passes

Focused validation:

- `pnpm --filter e2e-web exec playwright test tests/api/api-access-dataset-resources.spec.ts`
- `make check`

Resume notes:

- owner: OpenCode
- last change: Added `apps/web/src/app/api/datasets/[id]/download/route.ts`, aligned the access check with request-scoped auth and current dataset membership rules, and removed the matching `api-old` download route.
- follow-ups: none.

## Task 7: Migrate Dataset Analysis Proxy Endpoints

Status: `[x]`

Goal:

- migrate the analysis-service proxy routes for raw data and stats

Public endpoints:

- `POST /api/datasets/:id/raw-data`
- `POST /api/datasets/:id/stats`

Current files:

- old routes:
  - `apps/web/src/app/api-old/datasets/[id]/raw-data/route.ts`
  - `apps/web/src/app/api-old/datasets/[id]/stats/route.ts`
- tests:
  - `packages/e2e-web/tests/api/api-access-dataset-raw-data.spec.ts`
  - `packages/e2e-web/tests/api/api-access-dataset-resources.spec.ts`
  - `packages/e2e-web/tests/api/api-stats-descriptives.spec.ts`
  - `packages/e2e-web/tests/api/api-stats-frequencies.spec.ts`

Implementation guidance:

- recommended target is explicit Next route handlers under `apps/web/src/app/api/datasets/[id]/**`
- keep them as thin proxies around `createAnalysisClient()` with existing access checks
- preserve current request body forwarding and JSON error handling

Acceptance criteria:

- both endpoints are no longer served from `api-old`
- request bodies are forwarded correctly to the analysis service
- successful and failed analysis responses preserve current status and payload behavior
- the matching old route files are removed
- targeted API specs pass

Focused validation:

- `pnpm --filter e2e-web exec playwright test tests/api/api-access-dataset-raw-data.spec.ts`
- `pnpm --filter e2e-web exec playwright test tests/api/api-stats-descriptives.spec.ts`
- `pnpm --filter e2e-web exec playwright test tests/api/api-stats-frequencies.spec.ts`
- `make check`

Resume notes:

- owner: OpenCode
- last change: Added `app/api` raw-data and stats proxy routes, removed the matching `api-old` handlers, and revalidated the dataset analysis API specs after reseeding local data.
- follow-ups: none.

## Task 8: Migrate Dataset Export Proxy Endpoints

Status: `[x]`

Goal:

- migrate the dataset export endpoints for Excel and PowerPoint

Public endpoints:

- `POST /api/datasets/:id/exports/excel`
- `POST /api/datasets/:id/exports/powerpoint`

Current files:

- old routes:
  - `apps/web/src/app/api-old/datasets/[id]/exports/excel/route.ts`
  - `apps/web/src/app/api-old/datasets/[id]/exports/powerpoint/route.ts`
- callers:
  - `apps/web/src/lib/adhoc-export.ts`
- tests:
  - `packages/e2e-web/tests/api/api-access-dataset-exports-excel.spec.ts`
  - `packages/e2e-web/tests/api/api-access-dataset-exports-powerpoint.spec.ts`
  - `packages/e2e-web/tests/adhoc-analysis-export-theme-colors.spec.ts`

Implementation guidance:

- recommended target is explicit Next route handlers under `apps/web/src/app/api/datasets/[id]/exports/**`
- preserve binary response passthrough, content type, content disposition, and JSON error passthrough
- keep access checks in front of the analysis proxy call

Acceptance criteria:

- both export endpoints are no longer served from `api-old`
- existing frontend export flows continue to work
- binary downloads and JSON error responses match current behavior
- the matching old route files are removed
- targeted API and UI specs pass

Focused validation:

- `pnpm --filter e2e-web exec playwright test tests/api/api-access-dataset-exports-excel.spec.ts`
- `pnpm --filter e2e-web exec playwright test tests/api/api-access-dataset-exports-powerpoint.spec.ts`
- `pnpm --filter e2e-web exec playwright test tests/adhoc-analysis-export-theme-colors.spec.ts`
- `make check`

Resume notes:

- owner: OpenCode
- last change: Added `app/api` Excel and PowerPoint export proxy routes, removed the matching `api-old` handlers, and updated the export-theme E2E spec to match the current localized/stable UI controls.
- follow-ups: none.

## Task 9: Migrate Dataset Variableset Transfer Endpoints

Status: `[x]`

Goal:

- migrate variableset export and import for datasets

Public endpoints:

- `GET /api/datasets/:id/variablesets/export`
- `POST /api/datasets/:id/variablesets/import`

Current files:

- old routes:
  - `apps/web/src/app/api-old/datasets/[id]/variablesets/export/route.ts`
  - `apps/web/src/app/api-old/datasets/[id]/variablesets/import/route.ts`
- tests:
  - `packages/e2e-web/tests/api/api-access-dataset-variablesets.spec.ts`
  - `packages/e2e-web/tests/admin-dataset-variableset-export-import.spec.ts`

Implementation guidance:

- recommended target is explicit Next route handlers under `apps/web/src/app/api/datasets/[id]/variablesets/**`
- keep export as a downloadable JSON response
- keep import as multipart form handling with current file-type and options validation
- preserve admin-only behavior

Acceptance criteria:

- both transfer endpoints are no longer served from `api-old`
- export still downloads valid JSON with a stable filename pattern
- import still validates file type, options JSON, and payload shape before mutating data
- the matching old route files are removed
- targeted API and admin specs pass

Focused validation:

- `pnpm --filter e2e-web exec playwright test tests/api/api-access-dataset-variablesets.spec.ts`
- `pnpm --filter e2e-web exec playwright test tests/admin-dataset-variableset-export-import.spec.ts`
- `make check`

Resume notes:

- owner: OpenCode
- last change: Added `app/api` variableset export/import routes, removed the matching `api-old` handlers, and updated the admin transfer E2E setup to match the active `/api/datasets` response shape.
- follow-ups: none.
