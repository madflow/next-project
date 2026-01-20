import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

test.describe("Adhoc Analysis - Chart Type Switching", () => {
  test("should switch between available chart types for Geschlecht variable", async ({ page }) => {
    // Login as admin
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);

    // Navigate to adhoc analysis
    await page.goto("/project/test-project/adhoc");
    await expect(page.getByTestId("app.project.adhoc")).toBeVisible();

    // Select SPSS Beispielumfrage dataset (NOT fallback - MUST exist)
    await page.getByTestId("app.dropdown.dataset.trigger").click();
    await page.getByText("SPSS Beispielumfrage").click();

    const datasetTrigger = page.getByTestId("app.dropdown.dataset.trigger");
    await expect(datasetTrigger).toContainText("SPSS Beispielumfrage");

    // Expand Demografische Daten group (MUST exist from seed)
    const demografischeGroup = page.getByTestId("variable-group-Demografische Daten");
    await expect(demografischeGroup).toBeVisible();

    // Click the expand button to expand the group
    const expandButton = page.getByTestId("variable-group-expand-Demografische Daten");
    await expandButton.click();

    // Select Sex variable (categorical - good for chart testing)
    const geschlechtVariable = page.getByTestId("variable-item-sex");
    await expect(geschlechtVariable).toBeVisible();
    await geschlechtVariable.click();

    // Chart type selector MUST exist
    const chartTypeSelector = page.getByTestId("chart-type-selector");
    await expect(chartTypeSelector).toBeVisible();

    // Get all available chart type buttons
    const availableChartTypes = await page.locator('[data-testid^="chart-type-"]').all();
    const availableChartTypeIds = await Promise.all(
      availableChartTypes.map(async (btn) => {
        const testId = await btn.getAttribute("data-testid");
        return testId?.replace("chart-type-", "");
      })
    );

    // Filter out null values and the selector itself
    const chartTypeIds = availableChartTypeIds.filter(
      (id): id is string => id !== null && id !== undefined && id !== "selector"
    );

    // Assert we have at least some chart types available
    expect(chartTypeIds.length).toBeGreaterThan(0);

    // Test each available chart type
    for (const chartType of chartTypeIds) {
      // Click the chart type button
      const chartTypeButton = page.getByTestId(`chart-type-${chartType}`);
      await expect(chartTypeButton).toBeVisible();
      await chartTypeButton.click();

      // Verify a chart is visible (using canvas/svg as they are rendered by recharts)
      await expect(page.locator("canvas, svg").first()).toBeVisible();
    }
  });
});
