import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { DatasetVariableWithAttributes } from "@/types/dataset-variable";
import type { StatsResponse } from "@/types/stats";
import {
  type ChartSortConfig,
  getStackedBarSegmentCount,
  transformToMatrixData,
  transformToMultiResponseData,
  transformToMultiResponseIndividualBarData,
  transformToRechartsBarData,
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

  test("transformToMatrixData uses the first variable scale, aligns codes, and preserves variable order", () => {
    const firstVariable = createVariable({
      id: "first",
      name: "q1",
      label: "Service",
      valueLabels: { 10: "Excellent", 2: "Good", 1: "Poor" },
    });
    const secondVariable = createVariable({
      id: "second",
      name: "q2",
      label: "Support",
      valueLabels: { 1: "Poor", 2: "Good", 10: "Excellent" },
    });
    const result = transformToMatrixData([firstVariable, secondVariable], {
      q1: createBaseStats("q1", [
        { value: 1, counts: 20, percentages: 20 },
        { value: 2, counts: 30, percentages: 30 },
        { value: 10, counts: 50, percentages: 50 },
      ]),
      q2: createBaseStats("q2", [
        { value: "1.0", counts: 25, percentages: 25 },
        { value: 10, counts: 75, percentages: 75 },
      ]),
    });

    assert.deepStrictEqual(
      result.map((row) => row.category),
      ["Service", "Support"]
    );
    assert.deepStrictEqual(
      result[0]?.segments.map((segment) => segment.label),
      ["Poor", "Good", "Excellent"]
    );
    assert.deepStrictEqual(
      result[1]?.segments.map((segment) => segment.value),
      [25, 0, 75]
    );
    assert.deepStrictEqual(
      result[1]?.segments.map((segment) => segment.count),
      [25, 0, 75]
    );
  });

  test("transformToMatrixData excludes missing values and ranges from the shared scale", () => {
    const firstVariable = createVariable({
      name: "q1",
      valueLabels: {
        0: "NZ",
        1: "Very satisfied",
        2: "Fairly satisfied",
        3: "Not very satisfied",
        8: "KA",
        9: "NA",
      },
      missingRanges: {
        q1: [
          { lo: 0, hi: 0 },
          { lo: 8, hi: 9 },
        ],
      },
    });
    const result = transformToMatrixData([firstVariable], {
      q1: createBaseStats("q1", [
        { value: 1, counts: 20, percentages: 20 },
        { value: 2, counts: 30, percentages: 30 },
        { value: 3, counts: 50, percentages: 50 },
      ]),
    });

    assert.deepStrictEqual(
      result[0]?.segments.map((segment) => segment.label),
      ["Very satisfied", "Fairly satisfied", "Not very satisfied"]
    );
  });

  test("aggregate transforms throw when split stats leak into aggregate charts", () => {
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
    assert.throws(() => transformToMatrixData([variable], statsData), /must not receive split variable stats/);
  });

  test("transformToRechartsBarData sorts by value ascending by default", () => {
    const variable = createVariable();
    const stats = createBaseStats("q1", [
      { value: 3, counts: 10, percentages: 10 },
      { value: 1, counts: 50, percentages: 50 },
      { value: 2, counts: 40, percentages: 40 },
    ]);

    const result = transformToRechartsBarData(variable, stats);

    assert.deepStrictEqual(
      result.map((item) => item.value),
      [1, 2, 3]
    );
    assert.deepStrictEqual(
      result.map((item) => item.count),
      [50, 40, 10]
    );
  });

  test("transformToRechartsBarData sorts by counts ascending", () => {
    const variable = createVariable();
    const stats = createBaseStats("q1", [
      { value: 3, counts: 10, percentages: 10 },
      { value: 1, counts: 50, percentages: 50 },
      { value: 2, counts: 40, percentages: 40 },
    ]);
    const sortConfig: ChartSortConfig = { field: "counts", direction: "asc" };

    const result = transformToRechartsBarData(variable, stats, sortConfig);

    assert.deepStrictEqual(
      result.map((item) => item.value),
      [3, 2, 1]
    );
    assert.deepStrictEqual(
      result.map((item) => item.count),
      [10, 40, 50]
    );
  });

  test("transformToRechartsBarData sorts by counts descending", () => {
    const variable = createVariable();
    const stats = createBaseStats("q1", [
      { value: 3, counts: 10, percentages: 10 },
      { value: 1, counts: 50, percentages: 50 },
      { value: 2, counts: 40, percentages: 40 },
    ]);
    const sortConfig: ChartSortConfig = { field: "counts", direction: "desc" };

    const result = transformToRechartsBarData(variable, stats, sortConfig);

    assert.deepStrictEqual(
      result.map((item) => item.value),
      [1, 2, 3]
    );
    assert.deepStrictEqual(
      result.map((item) => item.count),
      [50, 40, 10]
    );
  });
});
