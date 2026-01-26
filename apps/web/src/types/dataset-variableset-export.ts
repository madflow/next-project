import { z } from "zod";

// Schema for attributes - matches datasetVariablesetItemAttributes from @repo/database/schema
export const VariableItemAttributesExportSchema = z.object({
  allowedStatistics: z.object({
    distribution: z.boolean(),
    mean: z.boolean(),
  }),
});

// Schema for a variable item with optional attributes
export const VariableItemExportSchema = z.object({
  name: z.string(),
  orderIndex: z.number(),
  attributes: VariableItemAttributesExportSchema.optional(),
});

export const VariableSetExportSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  parentName: z.string().nullable(),
  orderIndex: z.number(),
  category: z.enum(["general", "multi_response", "matrix"]).optional().default("general"),
  attributes: z
    .object({
      multiResponse: z
        .object({
          type: z.enum(["dichotomies", "categories"]),
          countedValue: z.number(),
        })
        .optional(),
    })
    .nullable()
    .optional(),
  variables: z.array(VariableItemExportSchema),
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
  details: z.array(
    z.object({
      setName: z.string(),
      status: z.enum(["created", "skipped", "updated", "failed"]),
      message: z.string().optional(),
      unmatchedVariables: z.array(z.string()).optional(),
    })
  ),
});

export type VariableItemAttributesExport = z.infer<typeof VariableItemAttributesExportSchema>;
export type VariableItemExport = z.infer<typeof VariableItemExportSchema>;
export type VariableSetExport = z.infer<typeof VariableSetExportSchema>;
export type VariableSetExportFile = z.infer<typeof VariableSetExportFileSchema>;
export type VariableSetImportOptions = z.infer<typeof VariableSetImportOptionsSchema>;
export type VariableSetImportResult = z.infer<typeof VariableSetImportResultSchema>;
