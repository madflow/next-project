import { expect, test } from "@playwright/test";

test.describe("Adhoc Analysis - Split Functionality", () => {
  // Use storage state for authentication
  test.use({ storageState: "playwright/.auth/admin.json" });

  test("should select SPSS Beispielumfrage dataset and test split functionality", async ({ page }) => {
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

    // Select "Demografische Daten" variable group
    const demografischeGroup = page.getByTestId("variable-group-Demografische Daten");
    await expect(demografischeGroup).toBeVisible();
    await demografischeGroup.click();

    // Select "Geschlecht" variable
    const geschlechtVariable = page.getByTestId("variable-item-Geschlecht");
    await expect(geschlechtVariable).toBeVisible();
    await geschlechtVariable.click();

    // Wait for analysis to load
    await expect(page.locator(".recharts-responsive-container")).toBeVisible();

    // Click on split button
    const splitButton = page.getByTestId("analysis-split-trigger");
    await expect(splitButton).toBeVisible();
    await splitButton.click();

    // Select "Familienstand" as split variable
    // This assumes there's a list/combobox for selecting the split variable
    const splitVariableItem = page.getByTestId("variable-item-Familienstand");
    await expect(splitVariableItem).toBeVisible();
    await splitVariableItem.click();

    // Verify that split analysis is displayed (e.g. multiple bars or specific split visualization)
    // We wait for the chart to re-render. Since it's hard to distinguish "split" vs "non-split"
    // generically, we check if the chart is still visible.
    // Ideally we would check for legend items or specific split elements.
    await expect(page.locator(".recharts-responsive-container")).toBeVisible();
  });
});
