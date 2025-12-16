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

    // Locate all available datasets in the dropdown
    const datasetItems = page.locator('[data-testid^="dataset-dropdown-item-"]');
    const count = await datasetItems.count();

    // Skip test if no datasets exist - this avoids conditional branching in test logic
    // which is flagged by playwright/no-conditional-in-test ESLint rule
    test.skip(count === 0, "No datasets available to test persistence");

    // At this point, at least one dataset exists - select the first one
    const firstDataset = datasetItems.first();
    const datasetName = await firstDataset.textContent();

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
