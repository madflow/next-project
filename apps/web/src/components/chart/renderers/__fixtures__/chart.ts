import type { ChartConfig } from "@repo/ui/components/chart";
import type { DatasetVariableWithAttributes } from "@/types/dataset-variable";
import type { StatsResponse } from "@/types/stats";

export const percentageChartConfig = {
  percentage: {
    color: "var(--chart-1)",
    label: "Percent",
  },
} satisfies ChartConfig;

export function createChartVariable(
  overrides: Partial<DatasetVariableWithAttributes> = {}
): DatasetVariableWithAttributes {
  return {
    id: "variable-id",
    name: "question",
    label: "Question label",
    type: "int32",
    measure: "nominal",
    createdAt: new Date(),
    variableLabels: null,
    valueLabels: {
      1: "First",
      2: "Second",
    },
    missingValues: null,
    missingRanges: null,
    datasetId: "dataset-id",
    ...overrides,
  };
}

export function createChartStats(): StatsResponse {
  return [
    {
      variable: "question",
      stats: {
        count: 100,
        mode: [1],
        mean: 1.4,
        std: 0.5,
        min: 0,
        max: 2,
        median: 1,
        range: 2,
        frequency_table: [
          { counts: 60, percentages: 60, value: 1 },
          { counts: 40, percentages: 40, value: 2 },
        ],
      },
    },
  ];
}
