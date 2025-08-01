import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { organization } from "./auth.js";

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

export const dataset = pgTable("datasets", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  filename: text("filename").notNull(), // Original filename
  fileType: text("file_type").notNull(), // sav, xlsx, csv, parquet, ods
  fileSize: bigint("file_size", { mode: "number" }).notNull(), // Size in bytes
  fileHash: text("file_hash").notNull(), // SHA-256 hash for integrity and deduplication
  missingValues: jsonb("missing_values").$type<string[] | null>(),
  storageKey: text("s3_key").notNull(), // S3 object key/path
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),

  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const insertDatasetSchema = createInsertSchema(dataset);
export const selectDatasetSchema = createSelectSchema(dataset);
export const updateDatasetSchema = createUpdateSchema(dataset);

export type CreateDatasetData = z.infer<typeof insertDatasetSchema>;
export type Dataset = z.infer<typeof selectDatasetSchema>;
export type UpdateDatasetData = z.infer<typeof updateDatasetSchema>;

export const datasetVariableLabelSchema = z
  .object({
    default: z.string().optional(),
  })
  .catchall(z.string().optional());

export const datasetVariableValueLabelSchema = z
  .object({
    default: z.string().optional(),
  })
  .catchall(z.string().optional());

export const datasetVariableLabelsSchema = z.record(z.string(), datasetVariableValueLabelSchema);

export type DatasetVariableLabel = z.infer<typeof datasetVariableLabelSchema>;
export type DatasetVariableValueLabel = z.infer<typeof datasetVariableValueLabelSchema>;
export type DatasetVariableLabels = z.infer<typeof datasetVariableLabelsSchema>;

export type DatasetVariableType = "float" | "double" | "int8" | "int16" | "int32" | "string" | "unknown";
export type DatasetVariableMeasure = "nominal" | "ordinal" | "scale" | "unknown";

export const typeEnum = pgEnum("dataset_variable_type", [
  "float",
  "double",
  "int8",
  "int16",
  "int32",
  "string",
  "unknown",
] as const);
export const measureEnum = pgEnum("dataset_variable_measure", ["nominal", "ordinal", "scale", "unknown"] as const);

export const datasetVariable = pgTable(
  "dataset_variables",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 64 }).notNull(),
    label: text("label"),
    type: typeEnum().notNull(),
    measure: measureEnum().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    variableLabels: jsonb("variable_labels").$type<DatasetVariableLabel>(),
    valueLabels: jsonb("value_labels").$type<DatasetVariableLabels | null>(),
    missingValues: jsonb("missing_values").$type<string[] | null>(),
    datasetId: uuid("dataset_id")
      .notNull()
      .references(() => dataset.id, { onDelete: "cascade" }),
  },
  (table) => [uniqueIndex("dataset_variable_unique_idx").on(table.name, table.datasetId)]
);

export const insertDatasetVariableSchema = createInsertSchema(datasetVariable);
export const selectDatasetVariableSchema = createSelectSchema(datasetVariable);
export const updateDatasetVariableSchema = createUpdateSchema(datasetVariable);

export type CreateDatasetVariableData = z.infer<typeof insertDatasetVariableSchema>;
export type DatasetVariable = z.infer<typeof selectDatasetVariableSchema>;
export type UpdateDatasetVariableData = z.infer<typeof updateDatasetVariableSchema>;

export const datasetProject = pgTable(
  "dataset_projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    datasetId: uuid("dataset_id")
      .notNull()
      .references(() => dataset.id, { onDelete: "cascade" }),
  },
  (table) => [uniqueIndex("dataset_project_unique_idx").on(table.projectId, table.datasetId)]
);

export const insertDatasetProjectSchema = createInsertSchema(datasetProject);
export const selectDatasetProjectSchema = createSelectSchema(datasetProject);
export const updateDatasetProjectSchema = createUpdateSchema(datasetProject);

export type CreateDatasetProjectData = z.infer<typeof insertDatasetProjectSchema>;
export type DatasetProject = z.infer<typeof selectDatasetProjectSchema>;
export type UpdateDatasetProjectData = z.infer<typeof updateDatasetProjectSchema>;
