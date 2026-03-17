import { type Page, expect, test } from "@playwright/test";
import { testIds } from "../../config";
import { loginAs } from "../../utils";

const TEST_ENDPOINT = `/api/datasets/${testIds.datasets.primary}/exports/excel`;

const EXPORT_BODY = JSON.stringify({
  file_name: "chart-export-2026-03-17.xlsx",
  title: "Age group",
  meta_line: "Dataset: Survey 2026 | Exported: Mar 17, 2026",
  labels: {
    label: "Label",
    value: "Value",
    value_percent: "Value (%)",
    color: "Color",
    metric: "Metric",
  },
  palette: ["#3b82f6", "#ef4444"],
  chart: {
    kind: "metrics",
    metrics: [
      { label: "Count", value: "100" },
      { label: "Mean", value: "1.5" },
    ],
  },
});

async function postExportRequest(page: Page) {
  return page.request.post(TEST_ENDPOINT, {
    data: EXPORT_BODY,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

test.describe("API dataset Excel export access @api", () => {
  test("denies access when not logged in", async ({ page }) => {
    const response = await postExportRequest(page);
    expect(response.status()).toBe(401);
  });

  test("denies access for user with no organization", async ({ page }) => {
    await loginAs(page, "accountInNoOrg");

    const response = await postExportRequest(page);
    expect(response.status()).toBe(401);
  });

  test("allows access for regular user with dataset access", async ({ page }) => {
    await loginAs(page, "regularUser");

    const response = await postExportRequest(page);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    expect(response.headers()["content-disposition"]).toContain('attachment; filename="chart-export-2026-03-17.xlsx"');
    expect(response.headers()["cache-control"]).toBe("private, max-age=0, must-revalidate");
    expect((await response.body()).byteLength).toBeGreaterThan(0);
  });

  test("allows access for admin without organization memberships", async ({ page }) => {
    await loginAs(page, "adminInNoOrg");

    const response = await postExportRequest(page);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    expect(response.headers()["content-disposition"]).toContain('attachment; filename="chart-export-2026-03-17.xlsx"');
    expect(response.headers()["cache-control"]).toBe("private, max-age=0, must-revalidate");
    expect((await response.body()).byteLength).toBeGreaterThan(0);
  });
});
