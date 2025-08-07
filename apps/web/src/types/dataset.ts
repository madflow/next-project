import { z } from "zod";
import {
  type CreateDatasetData,
  type Dataset,
  type UpdateDatasetData,
  insertDatasetSchema,
  selectDatasetSchema,
  updateDatasetSchema,
} from "@repo/database/schema";

export {
  insertDatasetSchema,
  selectDatasetSchema,
  updateDatasetSchema,
  type Dataset,
  type CreateDatasetData,
  type UpdateDatasetData,
};

export const datasetReadMetadataSchema = z.object({
  column_names: z.array(z.string()),
  column_labels: z.array(z.string().nullish()),
  column_names_to_labels: z.record(z.string(), z.string().nullish()),
  file_encoding: z.string(),
  number_columns: z.number(),
  number_rows: z.number(),
  variable_value_labels: z.record(z.string(), z.record(z.string(), z.string())),
  value_labels: z.record(z.string(), z.record(z.string(), z.string())),
  variable_to_label: z.record(z.string(), z.string()),
  notes: z.array(z.string()),
  original_variable_types: z.record(z.string(), z.string()),
  readstat_variable_types: z.record(z.string(), z.string()),
  table_name: z.string().nullable(),
  missing_ranges: z.record(z.string(), z.any()),
  missing_user_values: z.record(z.string(), z.any()),
  variable_storage_width: z.record(z.string(), z.number()),
  variable_display_width: z.record(z.string(), z.number()),
  variable_alignment: z.record(z.string(), z.string()),
  variable_measure: z.record(z.string(), z.string()),
  creation_time: z.string(),
  modification_time: z.string(),
  mr_sets: z.record(z.string(), z.any()),
  file_label: z.string().nullable(),
  file_format: z.string(),
});

export type DatasetReadMetadata = z.infer<typeof datasetReadMetadataSchema>;

export const datasetReadDataSchema = z.object({
  records: z.array(z.unknown()),
  columns: z.array(z.string()),
});

export const datasetReadResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
  dataset_id: z.string(),
  data: datasetReadDataSchema,
  metadata: datasetReadMetadataSchema,
});

export type DatasetReadData = z.infer<typeof datasetReadDataSchema>;
export type DatasetReadResponse = z.infer<typeof datasetReadResponseSchema>;
