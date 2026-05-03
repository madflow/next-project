import { z } from "zod";

const ValueRangeExportSchema = z
  .object({
    min: z.number(),
    max: z.number(),
  })
  .optional();

const VariableItemAttributesExportSchema = z.object({
  allowedStatistics: z.object({
    distribution: z.boolean(),
    mean: z.boolean(),
  }),
  valueRange: ValueRangeExportSchema,
});

const VariableItemExportSchema = z.object({
  name: z.string(),
  orderIndex: z.number(),
  attributes: VariableItemAttributesExportSchema.optional(),
});

// New: unified content entry for interleaved ordering
const ContentItemVariableVariant = z.object({
  position: z.number(),
  contentType: z.literal("variable"),
  variableName: z.string(),
  variableAttributes: VariableItemAttributesExportSchema.optional(),
});

const ContentItemSubsetVariant = z.object({
  position: z.number(),
  contentType: z.literal("subset"),
  subsetName: z.string(),
});

const ContentItemExportSchema = z.discriminatedUnion("contentType", [
  ContentItemVariableVariant,
  ContentItemSubsetVariant,
]);

const VariableSetExportSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  parentName: z.string().nullable(),
  orderIndex: z.number(),
  category: z.enum(["general", "multi_response"]).optional().default("general"),
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
  // New: unified contents array for interleaved ordering
  contents: z.array(ContentItemExportSchema).optional(),
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

export type VariableItemExport = z.infer<typeof VariableItemExportSchema>;
export type ContentItemExport = z.infer<typeof ContentItemExportSchema>;
export type VariableSetExport = z.infer<typeof VariableSetExportSchema>;
export type VariableSetExportFile = z.infer<typeof VariableSetExportFileSchema>;
export type VariableSetImportOptions = z.infer<typeof VariableSetImportOptionsSchema>;
export type VariableSetImportResult = {
  success: boolean;
  summary: {
    totalSets: number;
    createdSets: number;
    skippedSets: number;
    updatedSets: number;
    failedSets: number;
  };
  errors: string[];
  warnings: string[];
  details: {
    setName: string;
    status: "created" | "skipped" | "updated" | "failed";
    message?: string;
    unmatchedVariables?: string[];
  }[];
};
