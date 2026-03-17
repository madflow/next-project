import { expect, test } from "@playwright/test";

test.describe("API health access @api", () => {
  test("allows public access", async ({ page }) => {
    const response = await page.request.get("/api/health");
    expect([200, 503]).toContain(response.status());

    const data = await response.json();
    expect(data).toHaveProperty("status");
    expect(data).toHaveProperty("checks");
    expect(data).toHaveProperty("timestamp");
    expect(data.checks).toHaveProperty("database");
    expect(data.checks).toHaveProperty("s3");
    expect(data.checks).toHaveProperty("analysisService");
  });
});
