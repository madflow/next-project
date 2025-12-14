import { expect, test } from "@playwright/test";

const DATASET_NAME = "SPSS Beispielumfrage";

test.describe("Admin Dataset Variable Edit", () => {
  test.slow();

  // Use storage state for authentication
  test.use({ storageState: "playwright/.auth/admin.json" });

  test("should edit dataset variable with missing values, missing ranges, and measurement level", async ({ page }) => {
    // Navigate to the datasets page
    await page.goto("/admin/datasets");
    await expect(page.getByTestId("admin.datasets.page")).toBeVisible();

    // Search for and click on the test dataset
    await page.getByTestId("app.datatable.search-input").fill(DATASET_NAME);
    await page.getByRole("link", { name: DATASET_NAME }).click();

    // Search for the "age" variable
    await page.getByTestId("app.datatable.search-input").click();
    await page.getByTestId("app.datatable.search-input").fill("age");

    // Click the edit button for the age variable
    const editButton = page.getByTestId("app.admin.dataset-variable.edit-age");
    await expect(editButton).toBeVisible();
    await editButton.click();

    // Add missing values - locate the spinbutton within the Missing Values group
    const missingValuesGroup = page.getByRole("group").filter({ hasText: "Missing Values" });
    const missingValueInput = missingValuesGroup.getByRole("spinbutton").first();
    await missingValueInput.fill("9");
    await missingValuesGroup.getByRole("button").first().click();

    await missingValueInput.fill("99");
    await missingValuesGroup.getByRole("button").first().click();

    // Verify missing values were added - they should be displayed as readonly inputs
    await expect(missingValuesGroup.locator('input[readonly][value="9"]')).toBeVisible();
    await expect(missingValuesGroup.locator('input[readonly][value="99"]')).toBeVisible();

    // Add missing ranges - locate the spinbuttons within the Missing Ranges group
    const missingRangesGroup = page.getByRole("group").filter({ hasText: "Missing Ranges" });
    const rangeInputs = missingRangesGroup.getByRole("spinbutton");

    await rangeInputs.nth(0).fill("100");
    await rangeInputs.nth(1).fill("200");
    await missingRangesGroup.getByRole("button").first().click();

    // Verify missing range was added - should show "100 - 200"
    await expect(missingRangesGroup.locator('input[readonly][value="100"]')).toBeVisible();
    await expect(missingRangesGroup.locator('input[readonly][value="200"]')).toBeVisible();

    // Add another missing range
    await rangeInputs.nth(0).fill("300");
    await rangeInputs.nth(1).fill("400");
    await missingRangesGroup.getByRole("button").first().click();

    // Verify second missing range was added
    await expect(missingRangesGroup.locator('input[readonly][value="300"]')).toBeVisible();
    await expect(missingRangesGroup.locator('input[readonly][value="400"]')).toBeVisible();

    // Change measurement level
    const measureSelect = page.getByRole("combobox", { name: "Measure" });
    await measureSelect.click();
    await page.getByRole("option", { name: "Ordinal" }).click();

    // Save changes
    await page.getByRole("button", { name: "Save changes" }).click();

    // Verify we're back on the dataset editor page
    await expect(page.getByTestId("app.datatable.search-input")).toBeVisible();

    // Click edit again to verify the changes were saved
    await page.getByTestId("app.datatable.search-input").click();
    await page.getByTestId("app.datatable.search-input").fill("age");

    await expect(editButton).toBeVisible();
    await editButton.click();

    // Verify missing values are still there
    const missingValuesGroupRecheck = page.getByRole("group").filter({ hasText: "Missing Values" });
    await expect(missingValuesGroupRecheck.locator('input[readonly][value="9"]')).toBeVisible();
    await expect(missingValuesGroupRecheck.locator('input[readonly][value="99"]')).toBeVisible();

    // Verify missing ranges are still there
    const missingRangesGroupRecheck = page.getByRole("group").filter({ hasText: "Missing Ranges" });
    await expect(missingRangesGroupRecheck.locator('input[readonly][value="100"]')).toBeVisible();
    await expect(missingRangesGroupRecheck.locator('input[readonly][value="200"]')).toBeVisible();
    await expect(missingRangesGroupRecheck.locator('input[readonly][value="300"]')).toBeVisible();
    await expect(missingRangesGroupRecheck.locator('input[readonly][value="400"]')).toBeVisible();

    // Verify measurement level is still ordinal
    await expect(page.getByRole("combobox", { name: "Measure" })).toHaveText("Ordinal");

    // Clean up: Remove all missing values and ranges, reset measurement level to Scale
    // Remove all missing values
    const missingValuesGroupCleanup = page.getByRole("group").filter({ hasText: "Missing Values" });
    while ((await missingValuesGroupCleanup.locator("input[readonly]").count()) > 0) {
      await missingValuesGroupCleanup.getByRole("button").last().click();
    }

    // Remove all missing ranges
    const missingRangesGroupCleanup = page.getByRole("group").filter({ hasText: "Missing Ranges" });
    while ((await missingRangesGroupCleanup.locator("input[readonly]").count()) > 0) {
      await missingRangesGroupCleanup.getByRole("button").last().click();
    }

    // Reset measurement level to Scale
    const measureSelectCleanup = page.getByRole("combobox", { name: "Measure" });
    await measureSelectCleanup.click();
    await page.getByRole("option", { name: "Scale" }).click();

    // Save cleanup changes
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByTestId("app.datatable.search-input")).toBeVisible();
  });

  test("should validate missing ranges (low must be <= high)", async ({ page }) => {
    // Navigate to the datasets page
    await page.goto("/admin/datasets");
    await expect(page.getByTestId("admin.datasets.page")).toBeVisible();

    // Search for and click on the test dataset
    await page.getByTestId("app.datatable.search-input").fill(DATASET_NAME);
    await page.getByRole("link", { name: DATASET_NAME }).click();

    // Search for the "age" variable
    await page.getByTestId("app.datatable.search-input").click();
    await page.getByTestId("app.datatable.search-input").fill("age");

    // Click the edit button for the age variable
    const editButton = page.getByTestId("app.admin.dataset-variable.edit-age");
    await expect(editButton).toBeVisible();
    await editButton.click();

    // Try to add an invalid missing range (high < low)
    const missingRangesGroup = page.getByRole("group").filter({ hasText: "Missing Ranges" });
    const rangeInputs = missingRangesGroup.getByRole("spinbutton");

    await rangeInputs.nth(0).fill("200");
    await rangeInputs.nth(1).fill("100");
    await missingRangesGroup.getByRole("button").first().click();

    // Verify error message is displayed
    await expect(page.getByText("Low value must be less than or equal to high value")).toBeVisible();
  });

  test("should remove missing values and ranges", async ({ page }) => {
    // Navigate to the datasets page
    await page.goto("/admin/datasets");
    await expect(page.getByTestId("admin.datasets.page")).toBeVisible();

    // Search for and click on the test dataset
    await page.getByTestId("app.datatable.search-input").fill(DATASET_NAME);
    await page.getByRole("link", { name: DATASET_NAME }).click();

    // Search for the "age" variable
    await page.getByTestId("app.datatable.search-input").click();
    await page.getByTestId("app.datatable.search-input").fill("age");

    // Click the edit button for the age variable
    const editButton = page.getByTestId("app.admin.dataset-variable.edit-age");
    await expect(editButton).toBeVisible();
    await editButton.click();

    // Add a missing value
    const missingValuesGroup = page.getByRole("group").filter({ hasText: "Missing Values" });
    const missingValueInput = missingValuesGroup.getByRole("spinbutton").first();
    await missingValueInput.fill("999");
    await missingValuesGroup.getByRole("button").first().click();

    // Verify missing value was added
    await expect(missingValuesGroup.locator('input[readonly][value="999"]')).toBeVisible();

    // Add a missing range
    const missingRangesGroup = page.getByRole("group").filter({ hasText: "Missing Ranges" });
    const rangeInputs = missingRangesGroup.getByRole("spinbutton");

    await rangeInputs.nth(0).fill("500");
    await rangeInputs.nth(1).fill("600");
    await missingRangesGroup.getByRole("button").first().click();

    // Verify missing range was added
    await expect(missingRangesGroup.locator('input[readonly][value="500"]')).toBeVisible();
    await expect(missingRangesGroup.locator('input[readonly][value="600"]')).toBeVisible();

    // Remove the missing value by clicking the X button in the missing values group
    const removeMissingValueButton = missingValuesGroup.getByRole("button").last();
    await removeMissingValueButton.click();

    // Verify missing value was removed
    await expect(missingValuesGroup.locator('input[readonly][value="999"]')).toBeHidden();

    // Remove the missing range by clicking the X button in the missing ranges group
    const removeMissingRangeButton = missingRangesGroup.getByRole("button").last();
    await removeMissingRangeButton.click();

    // Verify missing range was removed
    await expect(missingRangesGroup.locator('input[readonly][value="500"]')).toBeHidden();
    await expect(missingRangesGroup.locator('input[readonly][value="600"]')).toBeHidden();
  });
});
