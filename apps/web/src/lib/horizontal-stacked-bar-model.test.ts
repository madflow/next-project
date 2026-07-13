import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createSplitHorizontalStackedBarModel } from "@/components/chart/renderers/horizontal-stacked-bar/model";
import type { SplitVariableStackedBarDataItem } from "@/lib/analysis-bridge";

describe("horizontal stacked bar model", () => {
  test("normalizes every matrix row independently and retains zero-filled segments", () => {
    const data: SplitVariableStackedBarDataItem[] = [
      {
        category: "Question 1",
        categoryKey: "q1",
        categoryIndex: 0,
        segments: [
          { segment: "segment0", label: "No", value: 20, count: 20, color: "var(--chart-1)" },
          { segment: "segment1", label: "Yes", value: 30, count: 30, color: "var(--chart-2)" },
        ],
      },
      {
        category: "Question 2",
        categoryKey: "q2",
        categoryIndex: 1,
        segments: [
          { segment: "segment0", label: "No", value: 0, count: 0, color: "var(--chart-1)" },
          { segment: "segment1", label: "Yes", value: 80, count: 80, color: "var(--chart-2)" },
        ],
      },
    ];

    const model = createSplitHorizontalStackedBarModel(data);

    assert.deepStrictEqual(model.chartData, [
      { label: "Question 1", segment0: 40, segment1: 60 },
      { label: "Question 2", segment0: 0, segment1: 100 },
    ]);
    assert.deepStrictEqual(
      model.segments.map((segment) => segment.label),
      ["No", "Yes"]
    );
  });
});
