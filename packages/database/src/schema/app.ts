import { sql } from "drizzle-orm";
import { check, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { organization } from "./auth";

export const project = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").unique().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
  },
  (table) => [
    check("project_slug_check", sql`${table.slug} ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'`),
    check("project_slug_reserved", sql`${table.slug} NOT IN ('admin', 'api', 'auth', 'landing', 'public', 'user')`),
  ]
);

export const insertProjectSchema = createInsertSchema(project);
export const selectProjectSchema = createSelectSchema(project);
export const updateProjectSchema = createUpdateSchema(project);

export type CreateProjectData = z.infer<typeof insertProjectSchema>;
export type Project = z.infer<typeof selectProjectSchema>;
export type UpdateProjectData = z.infer<typeof updateProjectSchema>;
