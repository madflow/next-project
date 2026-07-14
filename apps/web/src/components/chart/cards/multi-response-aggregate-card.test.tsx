import { render, waitFor } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { MultiResponseAggregateChartContent } from "./multi-response-aggregate-card";

const CHART_COLOR = "#2563eb";
const chartColors = Object.fromEntries(Array.from({ length: 6 }, (_, index) => [`chart-${index + 1}`, CHART_COLOR]));

describe("MultiResponseAggregateChartContent", () => {
  test("renders every bar with the single-series chart color", async () => {
    const { container } = render(
      <MultiResponseAggregateChartContent
        chartConfig={{ percentage: { color: "var(--chart-1)", label: "Percent" } }}
        chartColors={chartColors}
        chartData={[
          { count: 10, label: "First", orderIndex: 0, percentage: 25, variableName: "first" },
          { count: 20, label: "Second", orderIndex: 1, percentage: 50, variableName: "second" },
          { count: 30, label: "Third", orderIndex: 2, percentage: 75, variableName: "third" },
        ]}
        disableAnimation
        fileName="multi-response"
      />
    );

    const chartContainer = container.querySelector<HTMLElement>("[data-slot='chart']");
    expect(chartContainer).not.toBeNull();

    await waitFor(() => {
      expect(container.querySelectorAll(".recharts-bar-rectangle .recharts-rectangle")).toHaveLength(3);
    });

    const resolvedBarColors = Array.from(
      container.querySelectorAll<SVGElement>(".recharts-bar-rectangle .recharts-rectangle")
    ).map((bar) => {
      const fill = bar.getAttribute("fill");
      const variableMatch = fill?.match(/^var\((--chart-\d+)\)$/);
      expect(variableMatch).not.toBeNull();

      return chartContainer?.style.getPropertyValue(variableMatch?.[1] ?? "");
    });

    expect(resolvedBarColors).toEqual([CHART_COLOR, CHART_COLOR, CHART_COLOR]);
  });
});
