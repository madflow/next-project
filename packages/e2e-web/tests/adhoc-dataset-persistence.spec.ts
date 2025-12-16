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
    const datasetName = await firstDataset.textContent(); // eslint-disable-line playwright/prefer-web-first-assertions

    // Ensure dataset name exists and is not empty
    expect(datasetName).toBeTruthy();
    expect(datasetName?.trim()).not.toBe("");

    await firstDataset.click();

    // Verify dataset is selected
    const datasetTrigger = page.getByTestId("app.dropdown.dataset.trigger");
    await expect(datasetTrigger).toContainText(datasetName!);

    // Test page reload - should persist selection
    await page.reload();
    await expect(page.getByTestId("app.project.adhoc")).toBeVisible();

    const datasetTriggerAfterReload = page.getByTestId("app.dropdown.dataset.trigger");
    // Verify the selected dataset persists after reload
    await expect(datasetTriggerAfterReload).toContainText(datasetName!);
  });
});
