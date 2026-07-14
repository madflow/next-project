import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { useDatasetRawData } from "@/hooks/use-dataset-raw-data";
import { createChartVariable } from "../__fixtures__/chart";
import { TextExplorerRenderer } from "./renderer";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: { total: number }) =>
    key === "count" ? `${values?.total} responses` : key,
}));

vi.mock("@/hooks/use-dataset-raw-data", () => ({
  useDatasetRawData: vi.fn(),
}));

describe("TextExplorerRenderer", () => {
  test("renders text values and the total response count", () => {
    vi.mocked(useDatasetRawData).mockReturnValue({
      data: {
        status: "success",
        message: "",
        dataset_id: "dataset-id",
        data: {
          question: {
            values: ["First response", "Second response"],
            total_count: 2,
            non_empty_count: 2,
            total_non_empty_count: 2,
            total_pages: 1,
            page: 1,
          },
        },
      },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useDatasetRawData>);

    render(<TextExplorerRenderer variable={createChartVariable()} datasetId="dataset-id" />);

    expect(screen.getByText("First response")).not.toBeNull();
    expect(screen.getByText("Second response")).not.toBeNull();
    expect(screen.getByText("2 responses")).not.toBeNull();
  });
});
