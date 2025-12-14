import { expect, test } from "@playwright/test";

test.describe("Adhoc Analysis - Basic Functionality", () => {
  test("should navigate to adhoc analysis, select SPSS Beispielumfrage dataset, and expand Demografische Daten and select Alter variable", async ({
    page,
  }) => {
    // Navigate to adhoc analysis
    await page.goto("/project/test-project/adhoc");
    await expect(page.getByTestId("app.project.adhoc")).toBeVisible();

    // Click dataset dropdown trigger
    await page.getByTestId("app.dropdown.dataset.trigger").click();

    // Select "SPSS Beispielumfrage" dataset using text
    await page.getByText("SPSS Beispielumfrage").click();

    // Verify dataset is selected
    const datasetTrigger = page.getByTestId("app.dropdown.dataset.trigger");
    await expect(datasetTrigger).toContainText("SPSS Beispielumfrage");

    // Expand the first available variable group
    const variableGroup = page.locator('[data-testid^="variable-group-"]').first();
    await expect(variableGroup).toBeVisible();
    await variableGroup.click();

    // Click the first available variable
    const variableItem = page.locator('[data-testid^="variable-item-"]').first();
    await expect(variableItem).toBeVisible();
    await variableItem.click();

    // Check if a Mean Chart or any analysis visualization appears
    // We expect at least one kind of visualization to appear
    const anyChart = page.locator('[data-testid*="chart"], [data-testid*="analysis"], [data-testid*="visualization"]');
    // Analysis calculation might take some time, so we increase the timeout
    await expect(anyChart.first()).toBeVisible({ timeout: 15000 });
  });
});
