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
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("app.project.adhoc")).toBeVisible();

    // Click dataset dropdown trigger
    await page.getByTestId("app.dropdown.dataset.trigger").click();

    // Select "SPSS Beispielumfrage" dataset
    await page.getByText("SPSS Beispielumfrage").click();

    // Verify dataset is selected
    const datasetTrigger = page.getByTestId("app.dropdown.dataset.trigger");
    await expect(datasetTrigger).toContainText("SPSS Beispielumfrage");

    // Wait for variable groups to load
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    // Find "Informationsquellen" variable group
    const informationsquellenGroup = page.getByTestId("variable-group-Informationsquellen");

    // Verify the group exists
    await expect(informationsquellenGroup).toBeVisible();
    console.log("✓ Found Informationsquellen variable group");

    // Click on the Informationsquellen variableset to select it
    await informationsquellenGroup.click();

    // Wait for the multi-response chart to load
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    // Assert that the multi-response chart is displayed
    const multiResponseChart = page.getByTestId("multi-response-chart");
    await expect(multiResponseChart).toBeVisible();
    console.log("✓ Multi-response chart is displayed");

    // Verify the chart title contains "Informationsquellen"
    await expect(multiResponseChart).toContainText("Informationsquellen");
    console.log("✓ Chart title contains 'Informationsquellen'");

    // Verify the chart has content (ChartContainer with BarChart)
    const chartContainer = multiResponseChart.locator('[class*="recharts"]').first();
    await expect(chartContainer).toBeVisible();
    console.log("✓ Chart container with visualization is rendered");

    // Additional verification: Check if the chart displays the expected variables
    // The multi-response chart should show news1-news5 variables
    // Note: The actual labels might be different from variable names
    // We just verify that there are multiple bars in the chart (horizontal bar chart)
    const bars = multiResponseChart.locator("svg .recharts-bar-rectangle");
    const barCount = await bars.count();

    // We expect at least one bar to be present
    expect(barCount).toBeGreaterThan(0);
    console.log(`✓ Chart displays ${barCount} bars`);

    // Verify that there's a download button in the footer
    const downloadButton = multiResponseChart.getByRole("button");
    await expect(downloadButton).toBeVisible();
    console.log("✓ Download button is available");

    console.log("\n✓ Multi-response variableset test completed successfully");
  });

  test("should expand Informationsquellen group and select individual variable", async ({ page }) => {
    // Login as admin
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);

    // Navigate to adhoc analysis
    await page.goto("/project/test-project/adhoc");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("app.project.adhoc")).toBeVisible();

    // Click dataset dropdown trigger
    await page.getByTestId("app.dropdown.dataset.trigger").click();

    // Select "SPSS Beispielumfrage" dataset
    await page.getByText("SPSS Beispielumfrage").click();

    // Verify dataset is selected
    const datasetTrigger = page.getByTestId("app.dropdown.dataset.trigger");
    await expect(datasetTrigger).toContainText("SPSS Beispielumfrage");

    // Wait for variable groups to load
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    // Find "Informationsquellen" variable group
    const informationsquellenGroup = page.getByTestId("variable-group-Informationsquellen");
    await expect(informationsquellenGroup).toBeVisible();

    // Find the expand button (chevron icon) for the Informationsquellen group
    // The expand button is a sibling of the group button
    const expandButton = page
      .locator('[data-testid="variable-group-Informationsquellen"]')
      .locator("..")
      .getByRole("button")
      .first();

    // Click to expand the group
    await expandButton.click();
    await page.waitForTimeout(1000);

    console.log("✓ Expanded Informationsquellen group");

    // Try to find one of the variables in the group
    // The variables should have labels, so we'll look for any variable item
    const variableItems = page.locator('[data-testid^="variable-item-"]');
    const variableCount = await variableItems.count();

    expect(variableCount).toBeGreaterThan(0);
    console.log(`✓ Found ${variableCount} variables in Informationsquellen group`);

    // Select the first variable
    const firstVariable = variableItems.first();
    const variableText = await firstVariable.textContent();
    console.log(`✓ Selecting variable: "${variableText}"`);

    await firstVariable.click();

    // Wait for analysis to load
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    // Verify that a chart is displayed (could be any chart type depending on the variable)
    const anyChart = page.locator('[data-testid*="chart"], [data-testid*="visualization"], [class*="recharts"]');
    await expect(anyChart.first()).toBeVisible();
    console.log("✓ Individual variable chart is displayed");

    console.log("\n✓ Individual variable selection test completed successfully");
  });
});
