import { render, waitFor } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { createChartStats, createChartVariable, percentageChartConfig } from "../__fixtures__/chart";
import { HorizontalBarChartRenderer } from "./renderer";

describe("HorizontalBarChartRenderer", () => {
  test("renders a horizontal bar for every category", async () => {
    const { container } = render(
      <HorizontalBarChartRenderer
        variable={createChartVariable()}
        stats={createChartStats()}
        chartConfig={percentageChartConfig}
        disableAnimation
      />
    );

    expect(container.querySelector<HTMLElement>("[data-slot='chart']")?.dataset.exportFilename).toBe("question");

    await waitFor(() => {
      expect(container.querySelectorAll(".recharts-bar-rectangle .recharts-rectangle")).toHaveLength(2);
    });

    expect(container.textContent).toContain("Second");
  });
});
