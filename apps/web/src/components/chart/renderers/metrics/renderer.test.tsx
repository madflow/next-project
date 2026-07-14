import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { createChartStats, createChartVariable } from "../__fixtures__/chart";
import { MetricsRenderer } from "./renderer";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("MetricsRenderer", () => {
  test("renders all summary metrics", () => {
    render(<MetricsRenderer variable={createChartVariable()} stats={createChartStats()} />);

    for (const label of ["count", "mean", "stdev", "median", "min", "max"]) {
      expect(screen.getByText(label)).not.toBeNull();
    }

    expect(screen.getByText("100")).not.toBeNull();
    expect(screen.getByText("1.4")).not.toBeNull();
    expect(screen.getByText("0.5")).not.toBeNull();
  });
});
