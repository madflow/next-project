import { z } from "zod";

export const VariableSetExportSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  parentName: z.string().nullable(),
  orderIndex: z.number(),
  variables: z.array(z.string()),
});

export const VariableSetExportFileSchema = z.object({
  metadata: z.object({
    datasetId: z.string(),
    datasetName: z.string(),
    exportedAt: z.string(),
    version: z.string(),
  }),
  variableSets: z.array(VariableSetExportSchema),
});

export const VariableSetImportOptionsSchema = z.object({
  conflictResolution: z.enum(["skip", "overwrite", "rename"]).default("skip"),
});

export const VariableSetImportResultSchema = z.object({
  success: z.boolean(),
  summary: z.object({
    totalSets: z.number(),
    createdSets: z.number(),
    skippedSets: z.number(),
    updatedSets: z.number(),
    failedSets: z.number(),
  }),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
  details: z.array(z.object({
    setName: z.string(),
    status: z.enum(["created", "skipped", "updated", "failed"]),
    message: z.string().optional(),
    unmatchedVariables: z.array(z.string()).optional(),
  })),
});

export type VariableSetExport = z.infer<typeof VariableSetExportSchema>;
export type VariableSetExportFile = z.infer<typeof VariableSetExportFileSchema>;
export type VariableSetImportOptions = z.infer<typeof VariableSetImportOptionsSchema>;
export type VariableSetImportResult = z.infer<typeof VariableSetImportResultSchema>;