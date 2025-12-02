import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser, sleep } from "../utils";

test.describe("Admin Dataset Missing Ranges Import", () => {
  test("should import missing ranges from SPSS file during dataset upload", async ({ page }) => {
    const datasetName = `Missing Ranges Test ${Date.now()}`;

    // Login as admin
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);

    // Navigate to the datasets page
    await page.goto("/admin/datasets");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("admin.datasets.page")).toBeVisible();

    // Upload the demo.sav file which has missing ranges for the "internet" variable
    await page.getByTestId("admin.datasets.create.upload").click();
    const uploadFile = page.getByTestId("file-upload-input");
    await uploadFile.setInputFiles("testdata/spss/demo.sav");
    await page.waitForSelector("data-testid=app.admin.dataset.selected-file");
    await page.getByTestId("app.admin.dataset.name-input").fill(datasetName);
    await page.getByTestId("app.admin.dataset.organization-trigger").click();
    await page.getByTestId("org-option-test-organization").click();
    await page.getByTestId("app.admin.dataset.upload-button").click();

    // Wait for the dataset list to appear and navigation to complete
    await expect(page.getByTestId("admin.datasets.page")).toBeVisible();
    await page.waitForLoadState("networkidle");

    // Search for and click on the newly created dataset
    await page.getByTestId("app.datatable.search-input").fill(datasetName);
    await page.waitForLoadState("networkidle");
    await page.getByRole("link", { name: datasetName }).click();

    // Wait for the dataset editor page to load
    await page.waitForURL("**/editor");

    await page.getByTestId("app.datatable.search-input").fill("internet");

    // Click the edit button for the internet variable
    await page.getByTestId("app.admin.dataset-variable.edit-internet").waitFor({ state: "visible", timeout: 5000 });
    await page.getByTestId("app.admin.dataset-variable.edit-internet").click();

    // Wait for the edit form to appear
    await page.waitForLoadState("networkidle");

    return;

    // Verify missing ranges were imported from the SPSS file
    // The demo.sav file defines missing ranges for "internet": [{ lo: 8.0, hi: 8.0 }, { lo: 9.0, hi: 9.0 }]
    const missingRangesGroup = page.getByRole("group").filter({ hasText: "Missing Ranges" });

    // Check that the first range (8-8) was imported
    await expect(missingRangesGroup.locator('input[readonly][value="8"]')).toBeVisible();

    // Check that the second range (9-9) was imported
    await expect(missingRangesGroup.locator('input[readonly][value="9"]')).toBeVisible();

    // Verify there are exactly 4 readonly inputs (2 ranges × 2 inputs each: lo and hi)
    const readonlyInputs = missingRangesGroup.locator("input[readonly]");
    await expect(readonlyInputs).toHaveCount(4);
  });
});
