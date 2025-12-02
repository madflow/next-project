import { sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  bigint,
  check,
  index,
  integer,
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
import { z } from "zod";
import { organization } from "./auth.js";

export const project = pgTable(
  "projects",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
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
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
  name: text("name").notNull(),
  description: text("description"),
  filename: text("filename").notNull(), // Original filename
  fileType: text("file_type").notNull(), // sav, xlsx, csv, parquet, ods
  fileSize: bigint("file_size", { mode: "number" }).notNull(), // Size in bytes
  fileHash: text("file_hash").notNull(), // SHA-256 hash for integrity and deduplication
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
export type MissingRange = {
  lo: number;
  hi: number;
};

export type MissingRanges = {
  [fieldName: string]: MissingRange[];
};

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
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    name: varchar("name", { length: 64 }).notNull(),
    label: text("label"),
    type: typeEnum().notNull(),
    measure: measureEnum().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    variableLabels: jsonb("variable_labels"),
    valueLabels: jsonb("value_labels"),
    missingValues: jsonb("missing_values").$type<Record<string, unknown>>(),
    missingRanges: jsonb("missing_ranges").$type<MissingRanges>(),
    datasetId: uuid("dataset_id")
      .notNull()
      .references(() => dataset.id, { onDelete: "cascade" }),
  },
  (table) => [uniqueIndex("dataset_variable_unique_idx").on(table.name, table.datasetId)]
);

export const insertDatasetVariableSchema = createInsertSchema(datasetVariable);
export const selectDatasetVariableSchema = createSelectSchema(datasetVariable);
export const updateDatasetVariableSchema = createUpdateSchema(datasetVariable, {
  valueLabels: z.record(z.string(), z.record(z.string(), z.string())).optional(),
  missingRanges: z
    .record(
      z.string(),
      z.array(
        z
          .object({
            lo: z.number(),
            hi: z.number(),
          })
          .refine((range) => range.lo <= range.hi, {
            message: "Low value must be less than or equal to high value",
          })
      )
    )
    .optional()
    .nullable(),
});

export type CreateDatasetVariableData = z.infer<typeof insertDatasetVariableSchema>;
export type DatasetVariable = z.infer<typeof selectDatasetVariableSchema>;
export type UpdateDatasetVariableData = z.infer<typeof updateDatasetVariableSchema>;

export const datasetProject = pgTable(
  "dataset_projects",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
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

export const datasetVariablesetCategoryEnum = pgEnum("dataset_variableset_category", [
  "general",
  "multi_response",
  "matrix",
] as const);

export type DatasetVariablesetCategory = z.infer<typeof datasetVariablesetCategoryEnum>;

export const datasetVariableset = pgTable(
  "dataset_variablesets",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    name: text("name").notNull(),
    description: text("description"),
    parentId: uuid("parent_id").references((): AnyPgColumn => datasetVariableset.id, {
      onDelete: "cascade",
    }),
    datasetId: uuid("dataset_id")
      .notNull()
      .references(() => dataset.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    orderIndex: integer("order_index").notNull().default(0),
    category: datasetVariablesetCategoryEnum().notNull().default("general"),
  },
  (table) => [
    uniqueIndex("dataset_variableset_name_dataset_idx").on(table.name, table.datasetId),
    index("dataset_variablesets_dataset_id_idx").on(table.datasetId),
    index("dataset_variablesets_parent_id_idx").on(table.parentId),
  ]
);

export const insertDatasetVariablesetSchema = createInsertSchema(datasetVariableset);
export const selectDatasetVariablesetSchema = createSelectSchema(datasetVariableset);
export const updateDatasetVariablesetSchema = createUpdateSchema(datasetVariableset);

export type CreateDatasetVariablesetData = z.infer<typeof insertDatasetVariablesetSchema>;
export type DatasetVariableset = z.infer<typeof selectDatasetVariablesetSchema>;
export type UpdateDatasetVariablesetData = z.infer<typeof updateDatasetVariablesetSchema>;

export const datasetVariablesetItemAttributes = z.object({
  allowedStatistics: z
    .object({
      distribution: z.boolean(),
      mean: z.boolean(),
    })
    .default({ distribution: true, mean: false }),
});

export type DatasetVariablesetItemAttributes = z.infer<typeof datasetVariablesetItemAttributes>;

export const datasetVariablesetItem = pgTable(
  "dataset_variableset_items",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    variablesetId: uuid("variableset_id")
      .notNull()
      .references(() => datasetVariableset.id, { onDelete: "cascade" }),
    variableId: uuid("variable_id")
      .notNull()
      .references(() => datasetVariable.id, { onDelete: "cascade" }),
    attributes: jsonb("attributes")
      .$type<DatasetVariablesetItemAttributes>()
      .default({
        allowedStatistics: { distribution: true, mean: false },
      }),
    orderIndex: integer("order_index").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("dataset_variableset_items_unique_idx").on(table.variablesetId, table.variableId),
    index("dataset_variableset_items_variableset_id_idx").on(table.variablesetId),
  ]
);

export const insertDatasetVariablesetItemSchema = createInsertSchema(datasetVariablesetItem).extend({
  attributes: datasetVariablesetItemAttributes.optional(),
});
export const selectDatasetVariablesetItemSchema = createSelectSchema(datasetVariablesetItem).extend({
  attributes: datasetVariablesetItemAttributes.nullable(),
});

export type CreateDatasetVariablesetItemData = z.infer<typeof insertDatasetVariablesetItemSchema>;
export type DatasetVariablesetItem = z.infer<typeof selectDatasetVariablesetItemSchema>;

export const datasetSplitVariable = pgTable(
  "dataset_splitvariables",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    datasetId: uuid("dataset_id")
      .notNull()
      .references(() => dataset.id, { onDelete: "cascade" }),
    variableId: uuid("variable_id")
      .notNull()
      .references(() => datasetVariable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("dataset_splitvariables_unique_idx").on(table.datasetId, table.variableId),
    index("dataset_splitvariables_dataset_id_idx").on(table.datasetId),
  ]
);

export const insertDatasetSplitVariableSchema = createInsertSchema(datasetSplitVariable);
export const selectDatasetSplitVariableSchema = createSelectSchema(datasetSplitVariable);
export const updateDatasetSplitVariableSchema = createUpdateSchema(datasetSplitVariable);

export type CreateDatasetSplitVariableData = z.infer<typeof insertDatasetSplitVariableSchema>;
export type DatasetSplitVariable = z.infer<typeof selectDatasetSplitVariableSchema>;
export type UpdateDatasetSplitVariableData = z.infer<typeof updateDatasetSplitVariableSchema>;
