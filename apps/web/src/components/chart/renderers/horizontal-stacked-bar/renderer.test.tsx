import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { createChartStats, createChartVariable } from "../__fixtures__/chart";
import { HorizontalStackedBarRenderer } from "./renderer";

describe("HorizontalStackedBarRenderer", () => {
  test("renders every category as a stacked segment", async () => {
    const { container } = render(
      <HorizontalStackedBarRenderer variable={createChartVariable()} stats={createChartStats()} disableAnimation />
    );

    expect(container.querySelector<HTMLElement>("[data-slot='chart']")?.dataset.exportFilename).toBe("question");

    expect(container.querySelectorAll("[style*='--color-segment']")).toHaveLength(2);
    expect(container.textContent).toContain("First");
    expect(container.textContent).toContain("Second");
  });
});
