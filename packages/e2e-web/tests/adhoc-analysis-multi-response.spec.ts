import { expect, test } from "@playwright/test";

test.describe("Adhoc Analysis - Multi-Response Variableset", () => {
  // Use storage state for authentication
  test.use({ storageState: "playwright/.auth/admin.json" });

  test("should select Informationsquellen variableset and display aggregated multi-response chart", async ({
    page,
  }) => {
    // Navigate to adhoc analysis
    await page.goto("/project/test-project/adhoc");
    await expect(page.getByTestId("app.project.adhoc")).toBeVisible();

    // Click dataset dropdown trigger
    await page.getByTestId("app.dropdown.dataset.trigger").click();

    // Select "SPSS Beispielumfrage" dataset
    await page.getByText("SPSS Beispielumfrage").click();

    // Verify dataset is selected
    const datasetTrigger = page.getByTestId("app.dropdown.dataset.trigger");
    await expect(datasetTrigger).toContainText("SPSS Beispielumfrage");

    // Find "Informationsquellen" variable group and wait for it to be visible
    const informationsquellenGroup = page.getByTestId("variable-group-Informationsquellen");

    // Verify the group exists
    await expect(informationsquellenGroup).toBeVisible();

    // Click on the Informationsquellen variableset to select it
    await informationsquellenGroup.click();

    // Assert that the multi-response chart is displayed
    const multiResponseChart = page.getByTestId("multi-response-chart");
    await expect(multiResponseChart).toBeVisible();

    // Verify the chart title contains "Informationsquellen"
    await expect(multiResponseChart).toContainText("Informationsquellen");

    // Verify the chart has content (ChartContainer with BarChart)
    const chartContainer = multiResponseChart.locator('[class*="recharts"]').first();
    await expect(chartContainer).toBeVisible();

    // Additional verification: Check if the chart displays the expected variables
    // The multi-response chart should show news1-news5 variables
    // Note: The actual labels might be different from variable names
    // We just verify that there are multiple bars in the chart (horizontal bar chart)
    const bars = multiResponseChart.locator("svg .recharts-bar-rectangle");

    // We expect at least one bar to be present
    // Using expect.poll or just awaiting the count if we want to be strict, but locator assertion is better
    // Since we can't easily assert "greater than 0" on a locator without evaluating,
    // we'll check that the first bar is visible, which implies > 0
    await expect(bars.first()).toBeVisible();

    // Verify that there's a download button in the footer
    const downloadButton = multiResponseChart.getByRole("button");
    await expect(downloadButton).toBeVisible();
  });

  test("should expand Informationsquellen group and select individual variable", async ({ page }) => {
    // Navigate to adhoc analysis
    await page.goto("/project/test-project/adhoc");
    await expect(page.getByTestId("app.project.adhoc")).toBeVisible();

    // Click dataset dropdown trigger
    await page.getByTestId("app.dropdown.dataset.trigger").click();

    // Select "SPSS Beispielumfrage" dataset
    await page.getByText("SPSS Beispielumfrage").click();

    // Verify dataset is selected
    const datasetTrigger = page.getByTestId("app.dropdown.dataset.trigger");
    await expect(datasetTrigger).toContainText("SPSS Beispielumfrage");

    // Find "Informationsquellen" variable group
    const informationsquellenGroup = page.getByTestId("variable-group-Informationsquellen");
    await expect(informationsquellenGroup).toBeVisible();

    // Use dedicated data-testid for the expand button
    const expandButton = page.getByTestId("variable-group-expand-Informationsquellen");

    // Click to expand the group
    await expandButton.click();

    // Try to find one of the variables in the group
    // The variables should have labels, so we'll look for any variable item
    const variableItems = page.locator('[data-testid^="variable-item-"]');

    // Wait for at least one variable item to be visible
    await expect(variableItems.first()).toBeVisible();

    // Select the first variable
    const firstVariable = variableItems.first();

    await firstVariable.click();

    // Verify that a chart is displayed (could be any chart type depending on the variable)
    const anyChart = page.locator('[data-testid*="chart"], [data-testid*="visualization"], [class*="recharts"]');
    await expect(anyChart.first()).toBeVisible();
  });
});
