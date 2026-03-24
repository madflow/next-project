import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { DatasetVariableWithAttributes } from "@/types/dataset-variable";
import type { StatsResponse } from "@/types/stats";
import {
  buildExcelFileName,
  buildExportMetaLine,
  buildPowerPointFileName,
  createMultiResponseExcelExportPayload,
  createMultiResponsePowerPointExportPayload,
  createVariableChartExcelExportPayload,
  createVariableChartPowerPointExportPayload,
  getComputedExportPalette,
  getExportPalette,
} from "./adhoc-export";

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

describe("adhoc export helpers", () => {
  test("buildExportMetaLine includes dataset split and export date", () => {
    const result = buildExportMetaLine({
      datasetName: "Survey 2026",
      exportedAtLabel: "Mar 17, 2026",
      labels: {
        dataset: "Dataset",
        exported: "Exported",
        split: "Split",
      },
      splitLabel: "Gender",
    });

    assert.strictEqual(result, "Dataset: Survey 2026 | Split: Gender | Exported: Mar 17, 2026");
  });

  test("buildPowerPointFileName appends date and pptx extension", () => {
    const result = buildPowerPointFileName("Age group", new Date("2026-03-17T10:00:00.000Z"));
    assert.strictEqual(result, "age-group-2026-03-17.pptx");
  });

  test("buildExcelFileName appends date and xlsx extension", () => {
    const result = buildExcelFileName("Age group", new Date("2026-03-17T10:00:00.000Z"));
    assert.strictEqual(result, "age-group-2026-03-17.xlsx");
  });

  test("getExportPalette falls back to defaults", () => {
    const result = getExportPalette(undefined);
    assert.deepStrictEqual(result, ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"]);
  });

  test("getComputedExportPalette resolves live chart CSS colors", () => {
    const paletteByVariable: Record<string, string> = {
      "var(--chart-1)": "rgb(59, 130, 246)",
      "var(--chart-2)": "rgb(29, 78, 216)",
      "var(--chart-3)": "rgb(96, 165, 250)",
      "var(--chart-4)": "rgb(147, 197, 253)",
      "var(--chart-5)": "rgb(219, 234, 254)",
      "var(--chart-6)": "rgb(239, 246, 255)",
    };

    const result = getComputedExportPalette(null, undefined, {
      createProbe: () =>
        ({
          style: { color: "", pointerEvents: "", position: "", visibility: "" },
          remove() {},
        }) as unknown as HTMLElement,
      getComputedColor: (probe) => paletteByVariable[probe.style.color] ?? "",
      resolveScope: () =>
        ({
          appendChild() {},
        }) as unknown as HTMLElement,
    });

    assert.deepStrictEqual(result, ["#3b82f6", "#1d4ed8", "#60a5fa", "#93c5fd", "#dbeafe", "#eff6ff"]);
  });

  test("getComputedExportPalette supports non-rgb computed CSS colors", () => {
    const paletteByVariable: Record<string, string> = {
      "var(--chart-1)": "lab(77.5052 -6.4629 -36.42)",
      "var(--chart-2)": "lab(54.1736 13.3369 -74.6839)",
      "var(--chart-3)": "lab(0 0 0)",
      "var(--chart-4)": "lab(0 0 0)",
      "var(--chart-5)": "lab(0 0 0)",
      "var(--chart-6)": "lab(0 0 0)",
    };
    const convertedColors: Record<string, string> = {
      "lab(77.5052 -6.4629 -36.42)": "#8ec5ff",
      "lab(54.1736 13.3369 -74.6839)": "#2b7fff",
      "lab(0 0 0)": "#000000",
    };

    const result = getComputedExportPalette(null, undefined, {
      createProbe: () =>
        ({
          style: { color: "", pointerEvents: "", position: "", visibility: "" },
          remove() {},
        }) as unknown as HTMLElement,
      getComputedColor: (probe) => paletteByVariable[probe.style.color] ?? "",
      resolveScope: () =>
        ({
          appendChild() {},
        }) as unknown as HTMLElement,
      colorToHex: (color) => convertedColors[color] ?? null,
    });

    assert.deepStrictEqual(result, ["#8ec5ff", "#2b7fff", "#000000", "#000000", "#000000", "#000000"]);
  });

  test("getComputedExportPalette falls back when CSS colors cannot be resolved", () => {
    const fallbackChartColors = {
      "chart-1": "#111111",
      "chart-2": "#222222",
      "chart-3": "#333333",
      "chart-4": "#444444",
      "chart-5": "#555555",
      "chart-6": "#666666",
    };

    const result = getComputedExportPalette(null, fallbackChartColors, {
      createProbe: () =>
        ({
          style: { color: "", pointerEvents: "", position: "", visibility: "" },
          remove() {},
        }) as unknown as HTMLElement,
      getComputedColor: () => "not-a-color",
      resolveScope: () =>
        ({
          appendChild() {},
        }) as unknown as HTMLElement,
    });

    assert.deepStrictEqual(result, ["#111111", "#222222", "#333333", "#444444", "#555555", "#666666"]);
  });

  test("createVariableChartPowerPointExportPayload maps bar chart data", () => {
    const payload = createVariableChartPowerPointExportPayload({
      chartType: "bar",
      metaLine: "Dataset: Survey",
      metricsLabels: {
        count: "Count",
        max: "Max",
        mean: "Mean",
        median: "Median",
        min: "Min",
        stdev: "Stdev",
      },
      palette: ["#123456"],
      stats: createStatsResponse(),
      variable: createVariable(),
    });

    assert.strictEqual(payload.chart.kind, "bar");
    if (payload.chart.kind !== "bar") {
      throw new Error("Expected bar chart kind");
    }
    assert.deepStrictEqual(payload.chart.points, [
      { label: "18-29", value: 55, color: "#123456" },
      { label: "30-44", value: 45, color: "#123456" },
    ]);
  });

  test("createVariableChartExcelExportPayload maps bar chart data", () => {
    const payload = createVariableChartExcelExportPayload({
      chartType: "bar",
      excelLabels: {
        color: "Color",
        label: "Label",
        metric: "Metric",
        value: "Value",
        valuePercent: "Value (%)",
      },
      metaLine: "Dataset: Survey",
      metricsLabels: {
        count: "Count",
        max: "Max",
        mean: "Mean",
        median: "Median",
        min: "Min",
        stdev: "Stdev",
      },
      palette: ["#123456"],
      stats: createStatsResponse(),
      variable: createVariable(),
    });

    assert.match(payload.file_name, /^age_group-\d{4}-\d{2}-\d{2}\.xlsx$/);
    assert.strictEqual(payload.chart.kind, "bar");
    if (payload.chart.kind !== "bar") {
      throw new Error("Expected bar chart kind");
    }
    assert.deepStrictEqual(payload.labels, {
      color: "Color",
      label: "Label",
      metric: "Metric",
      value: "Value",
      value_percent: "Value (%)",
    });
    assert.deepStrictEqual(payload.chart.points, [
      { label: "18-29", value: 55, color: "#123456" },
      { label: "30-44", value: 45, color: "#123456" },
    ]);
  });

  test("createMultiResponsePowerPointExportPayload maps aggregate chart data", () => {
    const payload = createMultiResponsePowerPointExportPayload({
      metaLine: "Dataset: Survey",
      palette: ["#123456"],
      statsData: {
        q1: [
          {
            variable: "q1",
            stats: {
              count: 100,
              mode: [1],
              mean: 1,
              std: 0.1,
              min: 0,
              max: 1,
              median: 1,
              range: 1,
              frequency_table: [
                { value: 0, counts: 40, percentages: 40 },
                { value: 1, counts: 60, percentages: 60 },
              ],
            },
          },
        ],
      },
      title: "Awareness",
      variables: [
        createVariable({ id: "q1", name: "q1", label: "Awareness", measure: "nominal", valueLabels: { 1: "Yes" } }),
      ],
    });

    assert.strictEqual(payload.chart.kind, "multiResponse");
    if (payload.chart.kind !== "multiResponse") {
      throw new Error("Expected multiResponse chart kind");
    }
    assert.deepStrictEqual(payload.chart.points, [{ label: "Awareness", value: 60, color: "#123456" }]);
  });

  test("createMultiResponseExcelExportPayload maps aggregate chart data", () => {
    const payload = createMultiResponseExcelExportPayload({
      excelLabels: {
        color: "Color",
        label: "Label",
        metric: "Metric",
        value: "Value",
        valuePercent: "Value (%)",
      },
      metaLine: "Dataset: Survey",
      palette: ["#123456"],
      statsData: {
        q1: [
          {
            variable: "q1",
            stats: {
              count: 100,
              mode: [1],
              mean: 1,
              std: 0.1,
              min: 0,
              max: 1,
              median: 1,
              range: 1,
              frequency_table: [
                { value: 0, counts: 40, percentages: 40 },
                { value: 1, counts: 60, percentages: 60 },
              ],
            },
          },
        ],
      },
      title: "Awareness",
      variables: [
        createVariable({ id: "q1", name: "q1", label: "Awareness", measure: "nominal", valueLabels: { 1: "Yes" } }),
      ],
    });

    assert.match(payload.file_name, /^awareness-multi-response-\d{4}-\d{2}-\d{2}\.xlsx$/);
    assert.strictEqual(payload.chart.kind, "multiResponse");
    if (payload.chart.kind !== "multiResponse") {
      throw new Error("Expected multiResponse chart kind");
    }
    assert.deepStrictEqual(payload.labels, {
      color: "Color",
      label: "Label",
      metric: "Metric",
      value: "Value",
      value_percent: "Value (%)",
    });
    assert.deepStrictEqual(payload.chart.points, [{ label: "Awareness", value: 60, color: "#123456" }]);
  });
});
