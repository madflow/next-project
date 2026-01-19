import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

const DATASET_NAME = "SPSS Beispielumfrage";

test.describe("Admin Dataset Variable Edit", () => {
  test.slow();

  test("should edit dataset variable with missing values, missing ranges, and measurement level", async ({ page }) => {
    // Login as admin
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);

    // Navigate to the datasets page
    await page.goto("/admin/datasets");
    await expect(page.getByTestId("admin.datasets.page")).toBeVisible();

    // Search for and click on the test dataset
    await page.getByTestId("app.datatable.search-input").fill(DATASET_NAME);
    await page.getByRole("link", { name: DATASET_NAME }).click();

    // Wait for the dataset editor page to load

    // Search for the "age" variable
    await page.getByTestId("app.datatable.search-input").click();
    await page.getByTestId("app.datatable.search-input").fill("age");

    // Click the edit button for the age variable
    await page.getByTestId("app.admin.dataset-variable.edit-age").waitFor({ state: "visible", timeout: 5000 });

    await page.getByTestId("app.admin.dataset-variable.edit-age").click();

    // Wait for the edit form to appear

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

    // Wait for the save to complete and return to the dataset editor

    // Verify we're back on the dataset editor page
    await expect(page.getByTestId("app.datatable.search-input")).toBeVisible();

    // Click edit again to verify the changes were saved
    await page.getByTestId("app.datatable.search-input").click();
    await page.getByTestId("app.datatable.search-input").fill("age");

    await page.getByTestId("app.admin.dataset-variable.edit-age").waitFor({ state: "visible", timeout: 5000 });
    await page.getByTestId("app.admin.dataset-variable.edit-age").click();

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
  });

  test("should validate missing ranges (low must be <= high)", async ({ page }) => {
    // Login as admin
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);

    // Navigate to the datasets page
    await page.goto("/admin/datasets");
    await expect(page.getByTestId("admin.datasets.page")).toBeVisible();

    // Search for and click on the test dataset
    await page.getByTestId("app.datatable.search-input").fill(DATASET_NAME);
    await page.getByRole("link", { name: DATASET_NAME }).click();
    await page.waitForURL("**/admin/datasets/**");

    // Wait for the dataset editor page to load

    // Search for the "age" variable
    await page.getByTestId("app.datatable.search-input").click();
    await page.getByTestId("app.datatable.search-input").fill("age");

    // Click the edit button for the age variable
    await page.getByTestId("app.admin.dataset-variable.edit-age").waitFor({ state: "visible", timeout: 5000 });

    await page.getByTestId("app.admin.dataset-variable.edit-age").click();

    // Wait for the edit form to appear

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
    // Login as admin
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);

    // Navigate to the datasets page
    await page.goto("/admin/datasets");
    await expect(page.getByTestId("admin.datasets.page")).toBeVisible();

    // Search for and click on the test dataset
    await page.getByTestId("app.datatable.search-input").fill(DATASET_NAME);
    await page.getByRole("link", { name: DATASET_NAME }).click();

    await page.waitForURL("**/admin/datasets/**");
    // Wait for the dataset editor page to load

    // Search for the "age" variable
    await page.getByTestId("app.datatable.search-input").click();
    await page.getByTestId("app.datatable.search-input").fill("age");

    // Click the edit button for the age variable

    await page.getByTestId("app.admin.dataset-variable.edit-age").waitFor({ state: "visible", timeout: 5000 });
    await page.getByTestId("app.admin.dataset-variable.edit-age").click();

    // Wait for the edit form to appear

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

  test("should add and edit variable labels with translations", async ({ page }) => {
    // Login as admin
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);

    // Navigate to the datasets page
    await page.goto("/admin/datasets");
    await expect(page.getByTestId("admin.datasets.page")).toBeVisible();

    // Search for and click on the test dataset
    await page.getByTestId("app.datatable.search-input").fill(DATASET_NAME);
    await page.getByRole("link", { name: DATASET_NAME }).click();
    await page.waitForURL("**/admin/datasets/**");

    // Search for the "age" variable
    await page.getByTestId("app.datatable.search-input").click();
    await page.getByTestId("app.datatable.search-input").fill("age");

    // Click the edit button for the age variable
    await page.getByTestId("app.admin.dataset-variable.edit-age").waitFor({ state: "visible", timeout: 5000 });
    await page.getByTestId("app.admin.dataset-variable.edit-age").click();

    // Locate the Variable Labels group
    const variableLabelsGroup = page.getByRole("group").filter({ hasText: "Variable Labels" });

    // Store original values for cleanup
    const defaultLabelInput = variableLabelsGroup.getByRole("textbox", { name: /Default Label/i });
    const germanInput = variableLabelsGroup.getByRole("textbox", { name: /German/i });
    const englishInput = variableLabelsGroup.getByRole("textbox", { name: /English/i });

    const originalDefault = await defaultLabelInput.inputValue();
    const originalGerman = await germanInput.inputValue();
    const originalEnglish = await englishInput.inputValue();

    // Set new variable labels
    await defaultLabelInput.fill("Age of participant");
    await germanInput.fill("Alter des Teilnehmers");
    await englishInput.fill("Participant Age");

    // Save changes
    await page.getByRole("button", { name: "Save changes" }).click();

    // Wait for return to dataset editor page
    await expect(page.getByTestId("app.datatable.search-input")).toBeVisible();

    // Re-open the edit form
    await page.getByTestId("app.datatable.search-input").click();
    await page.getByTestId("app.datatable.search-input").fill("age");
    await page.getByTestId("app.admin.dataset-variable.edit-age").waitFor({ state: "visible", timeout: 5000 });
    await page.getByTestId("app.admin.dataset-variable.edit-age").click();

    // Verify all labels are persisted
    const variableLabelsGroupRecheck = page.getByRole("group").filter({ hasText: "Variable Labels" });
    const defaultLabelInputRecheck = variableLabelsGroupRecheck.getByRole("textbox", { name: /Default Label/i });
    const germanInputRecheck = variableLabelsGroupRecheck.getByRole("textbox", { name: /German/i });
    const englishInputRecheck = variableLabelsGroupRecheck.getByRole("textbox", { name: /English/i });

    await expect(defaultLabelInputRecheck).toHaveValue("Age of participant");
    await expect(germanInputRecheck).toHaveValue("Alter des Teilnehmers");
    await expect(englishInputRecheck).toHaveValue("Participant Age");

    // Cleanup: Restore original values
    await defaultLabelInputRecheck.fill(originalDefault);
    await germanInputRecheck.fill(originalGerman);
    await englishInputRecheck.fill(originalEnglish);
    await page.getByRole("button", { name: "Save changes" }).click();
  });

  test("should validate default label is required", async ({ page }) => {
    // Login as admin
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);

    // Navigate to the datasets page
    await page.goto("/admin/datasets");
    await expect(page.getByTestId("admin.datasets.page")).toBeVisible();

    // Search for and click on the test dataset
    await page.getByTestId("app.datatable.search-input").fill(DATASET_NAME);
    await page.getByRole("link", { name: DATASET_NAME }).click();
    await page.waitForURL("**/admin/datasets/**");

    // Search for the "age" variable
    await page.getByTestId("app.datatable.search-input").click();
    await page.getByTestId("app.datatable.search-input").fill("age");

    // Click the edit button for the age variable
    await page.getByTestId("app.admin.dataset-variable.edit-age").waitFor({ state: "visible", timeout: 5000 });
    await page.getByTestId("app.admin.dataset-variable.edit-age").click();

    // Locate the Variable Labels group
    const variableLabelsGroup = page.getByRole("group").filter({ hasText: "Variable Labels" });
    const defaultLabelInput = variableLabelsGroup.getByRole("textbox", { name: /Default Label/i });

    // Clear the default label
    await defaultLabelInput.clear();

    // Attempt to save
    await page.getByRole("button", { name: "Save changes" }).click();

    // Verify validation error is displayed
    await expect(variableLabelsGroup.getByText("Default label is required")).toBeVisible();

    // Verify we're still on the edit page (form submission was blocked)
    await expect(page.getByRole("button", { name: "Save changes" })).toBeVisible();
  });

  test("should remove optional translations", async ({ page }) => {
    // Login as admin
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);

    // Navigate to the datasets page
    await page.goto("/admin/datasets");
    await expect(page.getByTestId("admin.datasets.page")).toBeVisible();

    // Search for and click on the test dataset
    await page.getByTestId("app.datatable.search-input").fill(DATASET_NAME);
    await page.getByRole("link", { name: DATASET_NAME }).click();
    await page.waitForURL("**/admin/datasets/**");

    // Search for the "age" variable
    await page.getByTestId("app.datatable.search-input").click();
    await page.getByTestId("app.datatable.search-input").fill("age");

    // Click the edit button for the age variable
    await page.getByTestId("app.admin.dataset-variable.edit-age").waitFor({ state: "visible", timeout: 5000 });
    await page.getByTestId("app.admin.dataset-variable.edit-age").click();

    // Locate the Variable Labels group
    const variableLabelsGroup = page.getByRole("group").filter({ hasText: "Variable Labels" });
    const defaultLabelInput = variableLabelsGroup.getByRole("textbox", { name: /Default Label/i });
    const germanInput = variableLabelsGroup.getByRole("textbox", { name: /German/i });
    const englishInput = variableLabelsGroup.getByRole("textbox", { name: /English/i });

    // Store original values for cleanup
    const originalDefault = await defaultLabelInput.inputValue();
    const originalGerman = await germanInput.inputValue();
    const originalEnglish = await englishInput.inputValue();

    // Set labels with translations
    await defaultLabelInput.fill("Test Label");
    await germanInput.fill("Deutsches Label");
    await englishInput.fill("English Label");

    // Save and reopen
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByTestId("app.datatable.search-input")).toBeVisible();

    await page.getByTestId("app.datatable.search-input").click();
    await page.getByTestId("app.datatable.search-input").fill("age");
    await page.getByTestId("app.admin.dataset-variable.edit-age").waitFor({ state: "visible", timeout: 5000 });
    await page.getByTestId("app.admin.dataset-variable.edit-age").click();

    // Verify translations are present
    const variableLabelsGroup2 = page.getByRole("group").filter({ hasText: "Variable Labels" });
    const germanInput2 = variableLabelsGroup2.getByRole("textbox", { name: /German/i });
    const englishInput2 = variableLabelsGroup2.getByRole("textbox", { name: /English/i });

    await expect(germanInput2).toHaveValue("Deutsches Label");
    await expect(englishInput2).toHaveValue("English Label");

    // Clear the translation fields
    await germanInput2.clear();
    await englishInput2.clear();

    // Save and reopen
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByTestId("app.datatable.search-input")).toBeVisible();

    await page.getByTestId("app.datatable.search-input").click();
    await page.getByTestId("app.datatable.search-input").fill("age");
    await page.getByTestId("app.admin.dataset-variable.edit-age").waitFor({ state: "visible", timeout: 5000 });
    await page.getByTestId("app.admin.dataset-variable.edit-age").click();

    // Verify translations are now empty
    const variableLabelsGroup3 = page.getByRole("group").filter({ hasText: "Variable Labels" });
    const defaultLabelInput3 = variableLabelsGroup3.getByRole("textbox", { name: /Default Label/i });
    const germanInput3 = variableLabelsGroup3.getByRole("textbox", { name: /German/i });
    const englishInput3 = variableLabelsGroup3.getByRole("textbox", { name: /English/i });

    await expect(defaultLabelInput3).toHaveValue("Test Label");
    await expect(germanInput3).toHaveValue("");
    await expect(englishInput3).toHaveValue("");

    // Cleanup: Restore original values
    await defaultLabelInput3.fill(originalDefault);
    await germanInput3.fill(originalGerman);
    await englishInput3.fill(originalEnglish);
    await page.getByRole("button", { name: "Save changes" }).click();
  });

  test("should edit existing variable labels", async ({ page }) => {
    // Login as admin
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);

    // Navigate to the datasets page
    await page.goto("/admin/datasets");
    await expect(page.getByTestId("admin.datasets.page")).toBeVisible();

    // Search for and click on the test dataset
    await page.getByTestId("app.datatable.search-input").fill(DATASET_NAME);
    await page.getByRole("link", { name: DATASET_NAME }).click();
    await page.waitForURL("**/admin/datasets/**");

    // Search for the "age" variable
    await page.getByTestId("app.datatable.search-input").click();
    await page.getByTestId("app.datatable.search-input").fill("age");

    // Click the edit button for the age variable
    await page.getByTestId("app.admin.dataset-variable.edit-age").waitFor({ state: "visible", timeout: 5000 });
    await page.getByTestId("app.admin.dataset-variable.edit-age").click();

    // Locate the Variable Labels group
    const variableLabelsGroup = page.getByRole("group").filter({ hasText: "Variable Labels" });
    const defaultLabelInput = variableLabelsGroup.getByRole("textbox", { name: /Default Label/i });
    const germanInput = variableLabelsGroup.getByRole("textbox", { name: /German/i });

    // Store original values for cleanup
    const originalDefault = await defaultLabelInput.inputValue();
    const originalGerman = await germanInput.inputValue();
    const originalEnglish = await variableLabelsGroup.getByRole("textbox", { name: /English/i }).inputValue();

    // Set initial label
    await defaultLabelInput.fill("Original Label");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByTestId("app.datatable.search-input")).toBeVisible();

    // Reopen and verify
    await page.getByTestId("app.datatable.search-input").click();
    await page.getByTestId("app.datatable.search-input").fill("age");
    await page.getByTestId("app.admin.dataset-variable.edit-age").waitFor({ state: "visible", timeout: 5000 });
    await page.getByTestId("app.admin.dataset-variable.edit-age").click();

    const variableLabelsGroup2 = page.getByRole("group").filter({ hasText: "Variable Labels" });
    const defaultLabelInput2 = variableLabelsGroup2.getByRole("textbox", { name: /Default Label/i });
    await expect(defaultLabelInput2).toHaveValue("Original Label");

    // Update label and add translation
    await defaultLabelInput2.fill("Updated Label");
    const germanInput2 = variableLabelsGroup2.getByRole("textbox", { name: /German/i });
    await germanInput2.fill("Aktualisiertes Label");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByTestId("app.datatable.search-input")).toBeVisible();

    // Reopen and verify updates
    await page.getByTestId("app.datatable.search-input").click();
    await page.getByTestId("app.datatable.search-input").fill("age");
    await page.getByTestId("app.admin.dataset-variable.edit-age").waitFor({ state: "visible", timeout: 5000 });
    await page.getByTestId("app.admin.dataset-variable.edit-age").click();

    const variableLabelsGroup3 = page.getByRole("group").filter({ hasText: "Variable Labels" });
    const defaultLabelInput3 = variableLabelsGroup3.getByRole("textbox", { name: /Default Label/i });
    const germanInput3 = variableLabelsGroup3.getByRole("textbox", { name: /German/i });

    await expect(defaultLabelInput3).toHaveValue("Updated Label");
    await expect(germanInput3).toHaveValue("Aktualisiertes Label");

    // Modify German translation
    await germanInput3.fill("Geändertes Label");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByTestId("app.datatable.search-input")).toBeVisible();

    // Reopen and verify final modification
    await page.getByTestId("app.datatable.search-input").click();
    await page.getByTestId("app.datatable.search-input").fill("age");
    await page.getByTestId("app.admin.dataset-variable.edit-age").waitFor({ state: "visible", timeout: 5000 });
    await page.getByTestId("app.admin.dataset-variable.edit-age").click();

    const variableLabelsGroup4 = page.getByRole("group").filter({ hasText: "Variable Labels" });
    const germanInput4 = variableLabelsGroup4.getByRole("textbox", { name: /German/i });
    await expect(germanInput4).toHaveValue("Geändertes Label");

    // Cleanup: Restore original values
    const defaultLabelInput4 = variableLabelsGroup4.getByRole("textbox", { name: /Default Label/i });
    const englishInput4 = variableLabelsGroup4.getByRole("textbox", { name: /English/i });

    await defaultLabelInput4.fill(originalDefault);
    await germanInput4.fill(originalGerman);
    await englishInput4.fill(originalEnglish);
    await page.getByRole("button", { name: "Save changes" }).click();
  });
});
