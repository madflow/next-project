# Task Management Rules

## How to work with tasks

- Create new tasks by adding them to the task list with a descriptive title
- Mark tasks as completed by changing `[ ]` to `[x]` when finished
- Execute `make check` after completing each task to verify changes
- Keep tasks specific and actionable

## Task 1: Remove missingValues from packages/database dataset schema

- [ ] Remove missingValues field from dataset table/entity schema
- [ ] Run make db:prepare and make db:migrate after schema changes
- [ ] During dataset creation/upload, use missingValues to populate dataset variable missingValues instead of storing at dataset level
- [ ] Execute make check when finished