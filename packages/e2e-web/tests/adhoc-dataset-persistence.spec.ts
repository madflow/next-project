/* eslint-disable playwright/prefer-web-first-assertions */
import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

test.describe("Adhoc Analysis - Dataset Persistence", () => {
  test("should show placeholder when no dataset is selected", async ({ page }) => {
    // Login and navigate to adhoc analysis
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);

    await page.goto("/project/test-project/adhoc");
    await expect(page.getByTestId("app.project.adhoc")).toBeVisible();

    // Verify that the dataset selection shows placeholder text by default
    const datasetTrigger = page.getByTestId("app.dropdown.dataset.trigger");
    await expect(datasetTrigger).toContainText("Select a dataset");

    // Test page reload - should still show placeholder
    await page.reload();
    await expect(page.getByTestId("app.project.adhoc")).toBeVisible();

    const datasetTriggerAfterReload = page.getByTestId("app.dropdown.dataset.trigger");
    await expect(datasetTriggerAfterReload).toContainText("Select a dataset");

    // Test navigation - should still show placeholder
    await page.goBack();
    await page.goForward();
    await expect(page.getByTestId("app.project.adhoc")).toBeVisible();

    const datasetTriggerAfterNavigation = page.getByTestId("app.dropdown.dataset.trigger");
    await expect(datasetTriggerAfterNavigation).toContainText("Select a dataset");
  });

  test("should persist valid dataset selection", async ({ page }) => {
    // Login and navigate to adhoc analysis
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);

    await page.goto("/project/test-project/adhoc");
    await expect(page.getByTestId("app.project.adhoc")).toBeVisible();

    // Click dataset dropdown
    await page.getByTestId("app.dropdown.dataset.trigger").click();

    // Select the first dataset - at least one dataset must exist in the test environment
    const firstDataset = page.locator('[data-testid^="dataset-dropdown-item-"]').first();

    // Wait for and get the dataset name
    await expect(firstDataset).toBeVisible();
    // Need textContent() to extract value for later comparison, not just assertion
    const datasetName = await firstDataset.textContent();

    // Ensure dataset name exists and is not empty
    expect(datasetName).toBeTruthy();
    expect(datasetName?.trim()).not.toBe("");

    await firstDataset.click();

    // Verify dataset is selected
    const datasetTrigger = page.getByTestId("app.dropdown.dataset.trigger");
    await expect(datasetTrigger).toContainText(datasetName!);

    const currentUrl = new URL(page.url());
    expect(currentUrl.searchParams.get("dataset")).toBeTruthy();

    // Test page reload - should persist selection
    await page.reload();
    await expect(page.getByTestId("app.project.adhoc")).toBeVisible();

    const datasetTriggerAfterReload = page.getByTestId("app.dropdown.dataset.trigger");
    // Verify the selected dataset persists after reload
    await expect(datasetTriggerAfterReload).toContainText(datasetName!);

    const reloadedUrl = new URL(page.url());
    expect(reloadedUrl.searchParams.get("dataset")).toBe(currentUrl.searchParams.get("dataset"));
  });

  test("should persist selected variable in URL across reload and shared link", async ({ page, context }) => {
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);

    await page.goto("/project/test-project/adhoc");
    await expect(page.getByTestId("app.project.adhoc")).toBeVisible();

    await page.getByTestId("app.dropdown.dataset.trigger").click();
    await page.getByText("SPSS Beispielumfrage").click();

    const expandButton = page.getByTestId("variable-group-expand-Demografische Daten");
    await expect(expandButton).toBeVisible();
    await expandButton.click();

    const variable = page.getByTestId("variable-item-sex");
    await expect(variable).toBeVisible();
    await variable.click();

    const chartTypeSelector = page.getByTestId("chart-type-selector");
    await expect(chartTypeSelector).toBeVisible();

    const selectionUrl = new URL(page.url());
    expect(selectionUrl.searchParams.get("dataset")).toBeTruthy();
    expect(selectionUrl.searchParams.get("selectionType")).toBe("variable");
    expect(selectionUrl.searchParams.get("variable")).toBe("sex");

    await page.reload();
    await expect(page.getByTestId("app.project.adhoc")).toBeVisible();
    await expect(page.getByTestId("app.dropdown.dataset.trigger")).toContainText("SPSS Beispielumfrage");
    await expect(page.getByTestId("chart-type-selector")).toBeVisible();

    const sharedPage = await context.newPage();
    await sharedPage.goto(selectionUrl.toString());
    await expect(sharedPage.getByTestId("app.project.adhoc")).toBeVisible();
    await expect(sharedPage.getByTestId("app.dropdown.dataset.trigger")).toContainText("SPSS Beispielumfrage");
    await expect(sharedPage.getByTestId("chart-type-selector")).toBeVisible();
  });

  test("should persist selected variableset in URL across reload", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);

    await page.goto("/project/test-project/adhoc");
    await expect(page.getByTestId("app.project.adhoc")).toBeVisible();

    await page.getByTestId("app.dropdown.dataset.trigger").click();
    await page.getByText("SPSS Beispielumfrage").click();

    const mediennutzungExpandButton = page.getByTestId("variable-group-expand-Mediennutzung");
    await expect(mediennutzungExpandButton).toBeVisible();
    await mediennutzungExpandButton.click();

    const informationsquellenGroup = page.getByTestId("variable-group-Informationsquellen");
    await expect(informationsquellenGroup).toBeVisible();
    await informationsquellenGroup.click();

    const multiResponseChart = page.getByTestId("multi-response-chart");
    await expect(multiResponseChart).toBeVisible();

    const selectionUrl = new URL(page.url());
    expect(selectionUrl.searchParams.get("dataset")).toBeTruthy();
    expect(selectionUrl.searchParams.get("selectionType")).toBe("set");
    expect(selectionUrl.searchParams.get("set")).toBeTruthy();

    await page.reload();
    await expect(page.getByTestId("app.project.adhoc")).toBeVisible();
    await expect(page.getByTestId("app.dropdown.dataset.trigger")).toContainText("SPSS Beispielumfrage");
    await expect(page.getByTestId("multi-response-chart")).toBeVisible();
  });
});
