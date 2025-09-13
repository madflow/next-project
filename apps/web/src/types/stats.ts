import { z } from "zod";

// Schema for the request payload
export const StatsVariableSchema = z.object({
  variable: z.string(),
  split_variable: z.string().optional(),
});

export const StatsRequestSchema = z.object({
  variables: z.array(StatsVariableSchema),
  // Keep global split_variable for backward compatibility
  split_variable: z.string().optional(),
});

// Schema for the response
export const FrequencyItemSchema = z.object({
  value: z.union([z.string(), z.number()]),
  counts: z.number(),
  percentages: z.number(),
});

export const VariableStatsSchema = z.object({
  count: z.number(),
  mode: z.array(z.number()),
  mean: z.number(),
  std: z.number(),
  min: z.number(),
  max: z.number(),
  median: z.number(),
  range: z.number(),
  frequency_table: z.array(FrequencyItemSchema),
});

export const StatsResponseItemSchema = z.object({
  variable: z.string(),
  stats: z.union([
    VariableStatsSchema,
    z.object({
      split_variable: z.string(),
      categories: z.record(z.string(), VariableStatsSchema),
      split_variable_labels: z.record(z.string(), z.string()).optional()
    })
  ])
});

export const StatsResponseSchema = z.array(StatsResponseItemSchema);

// Infer types from schemas (optional - if you want to keep TypeScript types)
export type StatsVariable = z.infer<typeof StatsVariableSchema>;
export type StatsRequest = z.infer<typeof StatsRequestSchema>;
export type FrequencyItem = z.infer<typeof FrequencyItemSchema>;
export type VariableStats = z.infer<typeof VariableStatsSchema>;
export type StatsResponseItem = z.infer<typeof StatsResponseItemSchema>;
export type StatsResponse = z.infer<typeof StatsResponseSchema>;

export type AnalysisChartType = "bar" | "horizontalBar" | "horizontalStackedBar" | "pie" | "metrics" | "meanBar";
