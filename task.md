## Organisation Themes Feature Plan

### Goal

Allow each organisation to customize the colors used in charts (chart-1 through chart-6, with flexibility to support more in the future). These settings should be stored per organisation, editable by organisation admins and global admins, and applied consistently to all chart components.

---

### Rules for AI Coding Agents

- Follow Next.js and monorepo architecture conventions.
- Use TypeScript for all code; avoid any and enums.
- Store chart color settings in the organisation data model as a flexible structure (e.g., a map or array), not hard-coded to a fixed number.
- Allow editing of chart color variables (chart-1, chart-2, ..., chart-N), supporting future expansion.
- Ensure UI components read chart color settings reactively and efficiently.
- Use Tailwind CSS and Shadcn UI for styling.
- Update translations for any new UI elements.
- Do not duplicate code; prefer modular, reusable logic.
- Respect existing permissions: only organisation admins can change chart colors.
- Do not commit changes unless explicitly requested.
- Do not plan or execute database migrations in this task.
- Do not update documentation in this task.

---

## Task 1: Data Model

- [x] Review current organisation data model and settings structure.
- [x] Design a flexible schema for storing chart color settings (e.g., a map or array for chart-1 through chart-N).
- [x] Specify TypeScript types for chart color settings, supporting an extensible set of chart color variables.
- [x] Ensure chart color settings are optional and have sensible defaults.

## Task 2: Rename and Refactor Chart Colors Field

- [x] Rename the `chartColors` field in the `organizations` schema to `settings`.
- [x] Create a sub-section called `theme` within the `settings` field to store theme-related settings.
- [x] Update the schema to store chart color settings under `settings.theme.chartColors`.
- [x] Create a TypeScript type for the new settings structure to use with Drizzle ORM.
- [x] Ensure the new structure is flexible and supports future theme options.
- [x] Update the default chart colors function to work with the new structure.

## Task 3: Convert Theme to Themes Array

- [x] Rename `theme` to `themes` in the organization settings structure.
- [x] Change `settings.themes` to be an array of theme objects.
- [x] Each theme object should contain:
  - `name`: string (display name/identifier for the theme)
  - `chartColors`: Record<string, string> (mapping chart keys like chart-1 → hex color)
- [x] Update TypeScript types to reflect the new structure:
  - Create `ThemeItem` type with `name` and `chartColors` properties
  - Update `OrganizationSettings` to use `themes?: ThemeItem[]`
- [x] Update Zod schemas for validation of the new themes array structure.
- [x] Update the default organization settings function to return an array with a default theme.
- [x] Ensure the structure remains flexible for future theme properties (e.g., fonts, logos).
