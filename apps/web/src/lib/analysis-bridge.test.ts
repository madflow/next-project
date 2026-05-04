import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { DatasetVariableWithAttributes } from "@/types/dataset-variable";
import type { StatsResponse } from "@/types/stats";
import {
  getStackedBarSegmentCount,
  transformToMultiResponseData,
  transformToMultiResponseIndividualBarData,
  transformToSplitVariableStackedBarData,
} from "./analysis-bridge";

type VariableWithOrder = DatasetVariableWithAttributes & { orderIndex?: number | null };

function createVariable(overrides: Partial<VariableWithOrder> = {}): VariableWithOrder {
  return {
    id: "variable-id",
    name: "q1",
    label: "Question 1",
    type: "int32",
    measure: "nominal",
    createdAt: new Date(),
    variableLabels: null,
    valueLabels: {
      0: "No",
      1: "Yes",
      2: "Maybe",
    },
    missingValues: null,
    missingRanges: null,
    datasetId: "dataset-id",
    ...overrides,
  };
}

function createBaseStats(
  variableName: string,
  frequencyTable: Array<{ value: number | string; counts: number; percentages: number }>
): StatsResponse {
  return [
    {
      variable: variableName,
      stats: {
        count: 100,
        mode: [1],
        mean: 1,
        std: 0.2,
        min: 0,
        max: 2,
        median: 1,
        range: 2,
        frequency_table: frequencyTable,
      },
    },
  ];
}

describe("analysis-bridge transforms", () => {
  test("transformToSplitVariableStackedBarData sorts split categories and maps labels", () => {
    const variable = createVariable();
    const stats: StatsResponse = [
      {
        variable: "q1",
        stats: {
          split_variable: "gender",
          split_variable_labels: {
            1: "Women",
            2: "Men",
          },
          categories: {
            2: {
              count: 40,
              mode: [1],
              mean: 1,
              std: 0.1,
              min: 0,
              max: 1,
              median: 1,
              range: 1,
              frequency_table: [
                { value: 0, counts: 10, percentages: 25 },
                { value: 1, counts: 30, percentages: 75 },
              ],
            },
            1: {
              count: 60,
              mode: [1],
              mean: 1,
              std: 0.1,
              min: 0,
              max: 1,
              median: 1,
              range: 1,
              frequency_table: [
                { value: 0, counts: 20, percentages: 33.33 },
                { value: 1, counts: 40, percentages: 66.67 },
              ],
            },
          },
        },
      },
    ];

    const result = transformToSplitVariableStackedBarData(variable, stats);

    assert.deepStrictEqual(
      result.map((item) => item?.category),
      ["Women", "Men"]
    );
    assert.deepStrictEqual(result[0]?.segments.map((segment) => segment.label) ?? [], ["No", "Yes"]);
    assert.strictEqual(result[0]?.segments[1]?.value, 66.67);
  });

  test("getStackedBarSegmentCount returns the number of visible segments", () => {
    const variable = createVariable();
    const baseStats = createBaseStats("q1", [
      { value: 0, counts: 10, percentages: 10 },
      { value: 1, counts: 30, percentages: 30 },
      { value: 2, counts: 60, percentages: 60 },
    ]);

    assert.strictEqual(getStackedBarSegmentCount(variable, baseStats), 3);
  });

  test("transformToMultiResponseData uses counted value and sorts by order index", () => {
    const firstVariable = createVariable({ id: "first", name: "q1", label: "First", orderIndex: 2 });
    const secondVariable = createVariable({ id: "second", name: "q2", label: "Second", orderIndex: 1 });

    const statsData = {
      q1: createBaseStats("q1", [
        { value: 0, counts: 40, percentages: 40 },
        { value: 1, counts: 60, percentages: 60 },
      ]),
      q2: createBaseStats("q2", [
        { value: 0, counts: 55, percentages: 55 },
        { value: 1, counts: 45, percentages: 45 },
      ]),
    };

    const result = transformToMultiResponseData([firstVariable, secondVariable], statsData, 1);

    assert.deepStrictEqual(
      result.map((item) => ({ label: item.label, percentage: item.percentage })),
      [
        { label: "Second", percentage: 45 },
        { label: "First", percentage: 60 },
      ]
    );
  });

  test("transformToMultiResponseIndividualBarData returns zero values when counted option is missing", () => {
    const variable = createVariable();
    const stats = createBaseStats("q1", [{ value: 0, counts: 100, percentages: 100 }]);

    const result = transformToMultiResponseIndividualBarData(variable, stats, 1);

    assert.deepStrictEqual(result, [
      {
        label: "",
        value: 1,
        count: 0,
        percentage: 0,
      },
    ]);
  });

  test("transformToMultiResponseData throws when split stats leak into aggregate chart", () => {
    const variable = createVariable({ name: "q1", label: "Question 1" });
    const statsData = {
      q1: [
        {
          variable: "q1",
          stats: {
            split_variable: "gender",
            categories: {
              1: {
                count: 40,
                mode: [1],
                mean: 1,
                std: 0.1,
                min: 0,
                max: 1,
                median: 1,
                range: 1,
                frequency_table: [{ value: 1, counts: 40, percentages: 100 }],
              },
            },
          },
        },
      ] satisfies StatsResponse,
    };

    assert.throws(
      () => transformToMultiResponseData([variable], statsData, 1),
      /must not receive split variable stats/
    );
  });
});
