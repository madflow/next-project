import { render, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { createChartStats, createChartVariable } from "../__fixtures__/chart";
import { MeanBarRenderer } from "./renderer";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("MeanBarRenderer", () => {
  test("renders mean and median bars", async () => {
    const { container } = render(
      <MeanBarRenderer variable={createChartVariable()} stats={createChartStats()} disableAnimation />
    );

    expect(container.querySelector<HTMLElement>("[data-slot='chart']")?.dataset.exportFilename).toBe("question");

    await waitFor(() => {
      expect(container.querySelectorAll(".recharts-bar-rectangle .recharts-rectangle")).toHaveLength(2);
    });

    expect(container.textContent).toContain("median");
    expect(container.textContent).toContain("1.4");
    expect(container.textContent).toContain("1.0");
  });
});
