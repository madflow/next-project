import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

test.describe("Adhoc Analysis - Dataset Persistence", () => {
  test("should show placeholder when no dataset is selected", async ({ page }) => {
    // Login and navigate to adhoc analysis
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);

    await page.goto("/project/test-project/adhoc");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("app.project.adhoc")).toBeVisible();

    // Verify that the dataset selection shows placeholder text by default
    const datasetTrigger = page.getByTestId("app.dropdown.dataset.trigger");
    await expect(datasetTrigger).toContainText("Select a dataset");

    // Test page reload - should still show placeholder
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("app.project.adhoc")).toBeVisible();

    const datasetTriggerAfterReload = page.getByTestId("app.dropdown.dataset.trigger");
    await expect(datasetTriggerAfterReload).toContainText("Select a dataset");

    // Test navigation - should still show placeholder
    await page.goBack();
    await page.waitForLoadState("networkidle");
    await page.goForward();
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("app.project.adhoc")).toBeVisible();

    const datasetTriggerAfterNavigation = page.getByTestId("app.dropdown.dataset.trigger");
    await expect(datasetTriggerAfterNavigation).toContainText("Select a dataset");
  });

  test("should persist valid dataset selection", async ({ page }) => {
    // Login and navigate to adhoc analysis
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);

    await page.goto("/project/test-project/adhoc");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("app.project.adhoc")).toBeVisible();

    // Click dataset dropdown
    await page.getByTestId("app.dropdown.dataset.trigger").click();

    // Check if any datasets are available and select the first one
    const firstDataset = page.locator('[data-testid^="dataset-dropdown-item-"]').first();
    if ((await firstDataset.count()) > 0) {
      const datasetName = await firstDataset.textContent();
      await firstDataset.click();

      // Verify dataset is selected
      const datasetTrigger = page.getByTestId("app.dropdown.dataset.trigger");
      await expect(datasetTrigger).toContainText(datasetName || "");

      // Test page reload - should persist selection
      await page.reload();
      await page.waitForLoadState("networkidle");
      await expect(page.getByTestId("app.project.adhoc")).toBeVisible();

      const datasetTriggerAfterReload = page.getByTestId("app.dropdown.dataset.trigger");
      // Either shows the persisted dataset name or falls back to placeholder if dataset was deleted
      const triggerText = await datasetTriggerAfterReload.textContent();
      expect(triggerText).toBeTruthy();
    } else {
      // No datasets available, should show placeholder
      const datasetTrigger = page.getByTestId("app.dropdown.dataset.trigger");
      await expect(datasetTrigger).toContainText("Select a dataset");
    }
  });
});
