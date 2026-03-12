import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

test.describe("Adhoc Analysis - Multi-Response Variableset", () => {
  test("should select Informationsquellen variableset and display aggregated multi-response chart", async ({
    page,
  }) => {
    // Login as admin
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);

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

    // Wait for variable groups to load

    // Find "Informationsquellen" variable group and wait for it to be visible
    const informationsquellenGroup = page.getByTestId("variable-group-Informationsquellen");

    // Verify the group exists
    await expect(informationsquellenGroup).toBeVisible({ timeout: 5000 });

    // Click on the Informationsquellen variableset to select it
    await informationsquellenGroup.click();

    // Wait for the multi-response chart to load

    // Assert that the multi-response chart is displayed
    const multiResponseChart = page.getByTestId("multi-response-chart");
    await expect(multiResponseChart).toBeVisible({ timeout: 5000 });

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
    const barCount = await bars.count();

    // We expect at least one bar to be present
    expect(barCount).toBeGreaterThan(0);

    // Verify that there's a download button in the footer
    const downloadButton = multiResponseChart.getByRole("button");
    await expect(downloadButton).toBeVisible();
  });

  test("should expand Informationsquellen group and select individual variable", async ({ page }) => {
    // Login as admin
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);

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

    // Wait for variable groups to load

    // Find "Informationsquellen" variable group
    const informationsquellenGroup = page.getByTestId("variable-group-Informationsquellen");
    await expect(informationsquellenGroup).toBeVisible({ timeout: 5000 });

    // Use dedicated data-testid for the expand button
    const expandButton = page.getByTestId("variable-group-expand-Informationsquellen");

    // Click to expand the group
    await expandButton.click();

    // Try to find one of the variables in the group
    // The variables should have labels, so we'll look for any variable item
    const variableItems = page.locator('[data-testid^="variable-item-"]');

    // Wait for at least one variable item to be visible
    await expect(variableItems.first()).toBeVisible({ timeout: 3000 });
    const variableCount = await variableItems.count();

    expect(variableCount).toBeGreaterThan(0);

    // Select the first variable
    const firstVariable = variableItems.first();

    await firstVariable.click();

    // Verify that a chart is displayed (could be any chart type depending on the variable)
    const anyChart = page.locator('[data-testid*="chart"], [data-testid*="visualization"], [class*="recharts"]');
    await expect(anyChart.first()).toBeVisible({ timeout: 5000 });
  });
});
