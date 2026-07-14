import { render, waitFor } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { createChartStats, createChartVariable, percentageChartConfig } from "../__fixtures__/chart";
import { BarChartRenderer } from "./renderer";

describe("BarChartRenderer", () => {
  test("renders a bar for every category", async () => {
    const { container } = render(
      <BarChartRenderer
        variable={createChartVariable()}
        stats={createChartStats()}
        chartConfig={percentageChartConfig}
        disableAnimation
      />
    );

    const chart = container.querySelector<HTMLElement>("[data-slot='chart']");
    expect(chart?.dataset.exportFilename).toBe("question");

    await waitFor(() => {
      expect(container.querySelectorAll(".recharts-bar-rectangle .recharts-rectangle")).toHaveLength(2);
    });

    expect(container.textContent).toContain("Second");
  });
});
