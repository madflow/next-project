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

    // Select dataset - prioritize Politische Einstellungen if available
    // We try to click Politische Einstellungen, but if it fails (not found), we try SPSS
    // This is "brittle" but common when data state isn't guaranteed.
    // Ideally we should seed specific data.
    const politischeOption = page.getByText("Politische Einstellungen");
    const spssOption = page.getByText("SPSS Beispielumfrage");

    // Wait for at least one option to be visible
    await expect(politischeOption.or(spssOption)).toBeVisible();

    // We can use a try-catch block to handle the conditional logic implicitly or checks
    // However, eslint-plugin-playwright discourages conditionals.
    // The "best practice" way is to force a known state.
    // Since we can't easily force state here without seeding, we will assume "Politische Einstellungen"
    // is the primary target and fail if neither is found, but prefer it.

    if (await politischeOption.isVisible()) {
      await politischeOption.click();
    } else {
      await spssOption.click();
    }

    // Verify dataset is selected (relaxed check for either)
    await expect(datasetTrigger).toContainText(/(Politische Einstellungen|SPSS Beispielumfrage)/);

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

    const chartTypes = [
      "horizontalBar",
      "horizontalStackedBar",
      "pie",
      "meanBar",
      "bar",
    ];

    for (const chartType of chartTypes) {
      // Look for the chart type button using the data-testid pattern from the component
      const button = page.getByTestId(`chart-type-${chartType}`);

      // Check if button is visible before interacting (some variables don't support all types)
      if (await button.isVisible()) {
        await button.click();
        // Verify chart renders
        await expect(page.locator(".recharts-responsive-container, canvas, svg").first()).toBeVisible();
      }
    }
  });
});
