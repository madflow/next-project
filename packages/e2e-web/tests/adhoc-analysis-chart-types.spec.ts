import { expect, test } from "@playwright/test";

test.describe("Adhoc Analysis - Chart Type Switching", () => {
  // Use storage state for authentication
  test.use({ storageState: "playwright/.auth/admin.json" });

  test("should test switching between all available chart types for a selected variable", async ({ page }) => {
    // Navigate to adhoc analysis
    await page.goto("/project/test-project/adhoc");
    await expect(page.getByTestId("app.project.adhoc")).toBeVisible();

    // Click dataset dropdown trigger
    const datasetTrigger = page.getByTestId("app.dropdown.dataset.trigger");
    await datasetTrigger.click();

    // Select "Politische Einstellungen" dataset
    await page.getByText("Politische Einstellungen").click();

    // Verify dataset is selected
    await expect(datasetTrigger).toContainText("Politische Einstellungen");

    // Select variable group and variable
    const variableGroup = page.locator('[data-testid^="variable-group-"]').first();
    await expect(variableGroup).toBeVisible();
    await variableGroup.click();

    // Select first available variable
    const anyVariable = page.locator('[data-testid^="variable-item-"]').first();
    await expect(anyVariable).toBeVisible();
    await anyVariable.click();

    // Wait for chart selector
    const chartTypeSelector = page.getByTestId("chart-type-selector");
    await expect(chartTypeSelector).toBeVisible();

    // The chart type selector is a ToggleGroup, so we don't need to click it to open it.
    // We can directly access the chart type buttons.

    const chartTypes = ["horizontalBar", "horizontalStackedBar", "pie", "meanBar", "bar"];

    for (const chartType of chartTypes) {
      // Look for the chart type button using the data-testid pattern from the component
      const button = page.getByTestId(`chart-type-${chartType}`);

      await button.click();
      // Verify chart renders
      await expect(page.locator(".recharts-responsive-container, canvas, svg").first()).toBeVisible();
    }
  });
});
