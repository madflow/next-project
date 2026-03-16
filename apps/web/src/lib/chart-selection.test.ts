import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { DatasetVariableWithAttributes } from "@/types/dataset-variable";
import type { StatsResponse } from "@/types/stats";
import { determineChartSelection } from "./chart-selection";

function createVariable(overrides: Partial<DatasetVariableWithAttributes> = {}): DatasetVariableWithAttributes {
  return {
    id: "variable-id",
    name: "age_group",
    label: "Age group",
    type: "int32",
    measure: "ordinal",
    createdAt: new Date(),
    variableLabels: null,
    valueLabels: {
      1: "18-29",
      2: "30-44",
    },
    missingValues: null,
    missingRanges: null,
    datasetId: "dataset-id",
    ...overrides,
  };
}

function createStatsResponse(percentages: number[] = [55, 45]): StatsResponse {
  return [
    {
      variable: "age_group",
      stats: {
        count: 100,
        mode: [1],
        mean: 1.45,
        std: 0.5,
        min: 1,
        max: 2,
        median: 1,
        range: 1,
        frequency_table: percentages.map((percentage, index) => ({
          value: index + 1,
          counts: percentage,
          percentages: percentage,
        })),
      },
    },
  ];
}

describe("determineChartSelection", () => {
  test("returns text explorer for string variables", () => {
    const result = determineChartSelection({
      variable: createVariable({ type: "string", measure: "nominal" }),
      stats: createStatsResponse(),
    });

    assert.deepStrictEqual(result.availableChartTypes, ["textExplorer"]);
    assert.strictEqual(result.defaultChartType, "textExplorer");
    assert.strictEqual(result.canUseSplitVariable, false);
    assert.strictEqual(result.showUnsupportedPlaceholder, false);
  });

  test("filters charts by allowed statistics configuration", () => {
    const result = determineChartSelection({
      variable: createVariable({
        measure: "scale",
        attributes: {
          allowedStatistics: {
            distribution: false,
            mean: true,
          },
        },
      }),
      stats: createStatsResponse(),
    });

    assert.deepStrictEqual(result.availableChartTypes, ["meanBar", "metrics"]);
    assert.strictEqual(result.defaultChartType, "meanBar");
  });

  test("uses stacked chart as the only option when split stats are present", () => {
    const result = determineChartSelection({
      variable: createVariable(),
      stats: [
        {
          variable: "age_group",
          stats: {
            split_variable: "gender",
            split_variable_labels: { 1: "Women", 2: "Men" },
            categories: {
              1: {
                count: 50,
                mode: [1],
                mean: 1.4,
                std: 0.4,
                min: 1,
                max: 2,
                median: 1,
                range: 1,
                frequency_table: [
                  { value: 1, counts: 30, percentages: 60 },
                  { value: 2, counts: 20, percentages: 40 },
                ],
              },
            },
          },
        },
      ],
      hasSplitVariable: true,
    });

    assert.deepStrictEqual(result.availableChartTypes, ["horizontalStackedBar"]);
    assert.strictEqual(result.defaultChartType, "horizontalStackedBar");
    assert.strictEqual(result.showUnsupportedPlaceholder, false);
  });

  test("marks unsupported split charts when there are too many categories", () => {
    const result = determineChartSelection({
      variable: createVariable(),
      stats: createStatsResponse([20, 20, 20, 10, 10, 10, 10]),
      hasSplitVariable: true,
    });

    assert.deepStrictEqual(result.availableChartTypes, ["horizontalBar", "meanBar"]);
    assert.strictEqual(result.canUseSplitVariable, false);
    assert.strictEqual(result.showUnsupportedPlaceholder, true);
    assert.match(result.unsupportedReason ?? "", /more than 6 distinct values/);
  });

  test("restricts multi-response individual charts to horizontal layouts", () => {
    const baseResult = determineChartSelection({
      variable: createVariable(),
      stats: createStatsResponse(),
      isMultiResponseIndividual: true,
    });

    assert.deepStrictEqual(baseResult.availableChartTypes, ["horizontalBar"]);
    assert.strictEqual(baseResult.defaultChartType, "horizontalBar");

    const splitResult = determineChartSelection({
      variable: createVariable(),
      stats: [
        {
          variable: "age_group",
          stats: {
            split_variable: "gender",
            categories: {
              1: {
                count: 50,
                mode: [1],
                mean: 1,
                std: 0,
                min: 1,
                max: 1,
                median: 1,
                range: 0,
                frequency_table: [{ value: 1, counts: 50, percentages: 100 }],
              },
            },
          },
        },
      ],
      isMultiResponseIndividual: true,
    });

    assert.deepStrictEqual(splitResult.availableChartTypes, ["horizontalStackedBar"]);
    assert.strictEqual(splitResult.defaultChartType, "horizontalStackedBar");
  });
});
