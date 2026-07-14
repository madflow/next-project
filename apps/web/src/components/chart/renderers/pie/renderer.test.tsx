import { render, waitFor } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { createChartStats, createChartVariable } from "../__fixtures__/chart";
import { PieChartRenderer } from "./renderer";

describe("PieChartRenderer", () => {
  test("renders a sector and legend item for every category", async () => {
    const { container } = render(
      <PieChartRenderer variable={createChartVariable()} stats={createChartStats()} disableAnimation />
    );

    expect(container.querySelector<HTMLElement>("[data-slot='chart']")?.dataset.exportFilename).toBe("question");

    await waitFor(() => {
      expect(container.querySelectorAll(".recharts-pie-sector")).toHaveLength(2);
    });

    expect(container.textContent).toContain("First");
    expect(container.textContent).toContain("Second");
  });
});
