import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

const DATASET_NAME = "SPSS Beispielumfrage";

test.describe("Admin Dataset Variable Edit", () => {
  test.slow();

  test("should edit dataset variable with missing values, missing ranges, and measurement level", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);
    await page.goto("/admin/datasets");
    await expect(page.getByTestId("admin.datasets.page")).toBeVisible();
    await page.getByTestId("app.datatable.search-input").fill(DATASET_NAME);
    await page.getByRole("link", { name: DATASET_NAME }).click();
    await page.getByTestId("app.datatable.search-input").click();
    await page.getByTestId("app.datatable.search-input").fill("age");
    await page.getByTestId("app.admin.dataset-variable.edit-age").waitFor({ state: "visible", timeout: 5000 });
    await page.getByTestId("app.admin.dataset-variable.edit-age").click();
    const missingValuesGroup = page.getByRole("group").filter({ hasText: "Missing Values" });
    const missingValueInput = missingValuesGroup.getByRole("spinbutton").first();
    await missingValueInput.fill("9");
    await missingValuesGroup.getByRole("button").first().click();

    await missingValueInput.fill("99");
    await missingValuesGroup.getByRole("button").first().click();

    await expect(missingValuesGroup.locator('input[readonly][value="9"]')).toBeVisible();
    await expect(missingValuesGroup.locator('input[readonly][value="99"]')).toBeVisible();

    const missingRangesGroup = page.getByRole("group").filter({ hasText: "Missing Ranges" });
    const rangeInputs = missingRangesGroup.getByRole("spinbutton");
    await rangeInputs.nth(0).fill("100");
    await rangeInputs.nth(1).fill("200");
    await missingRangesGroup.getByRole("button").first().click();
    await expect(missingRangesGroup.locator('input[readonly][value="100"]')).toBeVisible();
    await expect(missingRangesGroup.locator('input[readonly][value="200"]')).toBeVisible();

    await rangeInputs.nth(0).fill("300");
    await rangeInputs.nth(1).fill("400");
    await missingRangesGroup.getByRole("button").first().click();
    await expect(missingRangesGroup.locator('input[readonly][value="300"]')).toBeVisible();
    await expect(missingRangesGroup.locator('input[readonly][value="400"]')).toBeVisible();

    const measureSelect = page.getByRole("combobox", { name: "Measure" });
    await measureSelect.click();
    await page.getByRole("option", { name: "Ordinal" }).click();
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByTestId("app.datatable.search-input")).toBeVisible();

    await page.getByTestId("app.datatable.search-input").click();
    await page.getByTestId("app.datatable.search-input").fill("age");
    await page.getByTestId("app.admin.dataset-variable.edit-age").waitFor({ state: "visible", timeout: 5000 });
    await page.getByTestId("app.admin.dataset-variable.edit-age").click();

    const missingValuesGroupRecheck = page.getByRole("group").filter({ hasText: "Missing Values" });
    await expect(missingValuesGroupRecheck.locator('input[readonly][value="9"]')).toBeVisible();
    await expect(missingValuesGroupRecheck.locator('input[readonly][value="99"]')).toBeVisible();

    const missingRangesGroupRecheck = page.getByRole("group").filter({ hasText: "Missing Ranges" });
    await expect(missingRangesGroupRecheck.locator('input[readonly][value="100"]')).toBeVisible();
    await expect(missingRangesGroupRecheck.locator('input[readonly][value="200"]')).toBeVisible();
    await expect(missingRangesGroupRecheck.locator('input[readonly][value="300"]')).toBeVisible();
    await expect(missingRangesGroupRecheck.locator('input[readonly][value="400"]')).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Measure" })).toHaveText("Ordinal");

    const missingValuesGroupCleanup = page.getByRole("group").filter({ hasText: "Missing Values" });
    while ((await missingValuesGroupCleanup.locator("input[readonly]").count()) > 0) {
      await missingValuesGroupCleanup.getByRole("button").last().click();
    }

    const missingRangesGroupCleanup = page.getByRole("group").filter({ hasText: "Missing Ranges" });
    while ((await missingRangesGroupCleanup.locator("input[readonly]").count()) > 0) {
      await missingRangesGroupCleanup.getByRole("button").last().click();
    }

    const measureSelectCleanup = page.getByRole("combobox", { name: "Measure" });
    await measureSelectCleanup.click();
    await page.getByRole("option", { name: "Scale" }).click();
    await page.getByRole("button", { name: "Save changes" }).click();
  });

  test("should validate missing ranges (low must be <= high)", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);
    await page.goto("/admin/datasets");
    await expect(page.getByTestId("admin.datasets.page")).toBeVisible();
    await page.getByTestId("app.datatable.search-input").fill(DATASET_NAME);
    await page.getByRole("link", { name: DATASET_NAME }).click();
    await page.waitForURL("**/admin/datasets/**");
    await page.getByTestId("app.datatable.search-input").click();
    await page.getByTestId("app.datatable.search-input").fill("age");
    await page.getByTestId("app.admin.dataset-variable.edit-age").waitFor({ state: "visible", timeout: 5000 });
    await page.getByTestId("app.admin.dataset-variable.edit-age").click();

    const missingRangesGroup = page.getByRole("group").filter({ hasText: "Missing Ranges" });
    const rangeInputs = missingRangesGroup.getByRole("spinbutton");
    await rangeInputs.nth(0).fill("200");
    await rangeInputs.nth(1).fill("100");
    await missingRangesGroup.getByRole("button").first().click();
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
    await page.getByTestId("app.datatable.search-input").click();
    await page.getByTestId("app.datatable.search-input").fill("age");
    await page.getByTestId("app.admin.dataset-variable.edit-age").waitFor({ state: "visible", timeout: 5000 });
    await page.getByTestId("app.admin.dataset-variable.edit-age").click();

    const missingValuesGroup = page.getByRole("group").filter({ hasText: "Missing Values" });
    const missingValueInput = missingValuesGroup.getByRole("spinbutton").first();
    await missingValueInput.fill("999");
    await missingValuesGroup.getByRole("button").first().click();
    await expect(missingValuesGroup.locator('input[readonly][value="999"]')).toBeVisible();

    const missingRangesGroup = page.getByRole("group").filter({ hasText: "Missing Ranges" });
    const rangeInputs = missingRangesGroup.getByRole("spinbutton");
    await rangeInputs.nth(0).fill("500");
    await rangeInputs.nth(1).fill("600");
    await missingRangesGroup.getByRole("button").first().click();
    await expect(missingRangesGroup.locator('input[readonly][value="500"]')).toBeVisible();
    await expect(missingRangesGroup.locator('input[readonly][value="600"]')).toBeVisible();

    const removeMissingValueButton = missingValuesGroup.getByRole("button").last();
    await removeMissingValueButton.click();
    await expect(missingValuesGroup.locator('input[readonly][value="999"]')).toBeHidden();

    const removeMissingRangeButton = missingRangesGroup.getByRole("button").last();
    await removeMissingRangeButton.click();
    await expect(missingRangesGroup.locator('input[readonly][value="500"]')).toBeHidden();
    await expect(missingRangesGroup.locator('input[readonly][value="600"]')).toBeHidden();
  });

  test("should add and edit variable labels with translations", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);
    await page.goto("/admin/datasets");
    await expect(page.getByTestId("admin.datasets.page")).toBeVisible();
    await page.getByTestId("app.datatable.search-input").fill(DATASET_NAME);
    await page.getByRole("link", { name: DATASET_NAME }).click();
    await page.waitForURL("**/admin/datasets/**");
    await page.getByTestId("app.datatable.search-input").click();
    await page.getByTestId("app.datatable.search-input").fill("age");
    await page.getByTestId("app.admin.dataset-variable.edit-age").waitFor({ state: "visible", timeout: 5000 });
    await page.getByTestId("app.admin.dataset-variable.edit-age").click();

    const variableLabelsGroup = page.getByRole("group").filter({ hasText: "Variable Labels" });
    const defaultLabelInput = variableLabelsGroup.getByRole("textbox", { name: /Default Label/i });
    const germanInput = variableLabelsGroup.getByRole("textbox", { name: /German/i });
    const englishInput = variableLabelsGroup.getByRole("textbox", { name: /English/i });

    const originalDefault = await defaultLabelInput.inputValue();
    const originalGerman = await germanInput.inputValue();
    const originalEnglish = await englishInput.inputValue();

    await defaultLabelInput.fill("Age of participant");
    await germanInput.fill("Alter des Teilnehmers");
    await englishInput.fill("Participant Age");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByTestId("app.datatable.search-input")).toBeVisible();

    await page.getByTestId("app.datatable.search-input").click();
    await page.getByTestId("app.datatable.search-input").fill("age");
    await page.getByTestId("app.admin.dataset-variable.edit-age").waitFor({ state: "visible", timeout: 5000 });
    await page.getByTestId("app.admin.dataset-variable.edit-age").click();

    const variableLabelsGroupRecheck = page.getByRole("group").filter({ hasText: "Variable Labels" });
    const defaultLabelInputRecheck = variableLabelsGroupRecheck.getByRole("textbox", { name: /Default Label/i });
    const germanInputRecheck = variableLabelsGroupRecheck.getByRole("textbox", { name: /German/i });
    const englishInputRecheck = variableLabelsGroupRecheck.getByRole("textbox", { name: /English/i });

    await expect(defaultLabelInputRecheck).toHaveValue("Age of participant");
    await expect(germanInputRecheck).toHaveValue("Alter des Teilnehmers");
    await expect(englishInputRecheck).toHaveValue("Participant Age");

    await defaultLabelInputRecheck.fill(originalDefault);
    await germanInputRecheck.fill(originalGerman);
    await englishInputRecheck.fill(originalEnglish);
    await page.getByRole("button", { name: "Save changes" }).click();
  });

  test("should validate default label is required", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);
    await page.goto("/admin/datasets");
    await expect(page.getByTestId("admin.datasets.page")).toBeVisible();
    await page.getByTestId("app.datatable.search-input").fill(DATASET_NAME);
    await page.getByRole("link", { name: DATASET_NAME }).click();
    await page.waitForURL("**/admin/datasets/**");
    await page.getByTestId("app.datatable.search-input").click();
    await page.getByTestId("app.datatable.search-input").fill("age");
    await page.getByTestId("app.admin.dataset-variable.edit-age").waitFor({ state: "visible", timeout: 5000 });
    await page.getByTestId("app.admin.dataset-variable.edit-age").click();

    const variableLabelsGroup = page.getByRole("group").filter({ hasText: "Variable Labels" });
    const defaultLabelInput = variableLabelsGroup.getByRole("textbox", { name: /Default Label/i });

    await defaultLabelInput.clear();
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(variableLabelsGroup.getByText("Default label is required")).toBeVisible();
    await expect(page.getByRole("button", { name: "Save changes" })).toBeVisible();
  });

  test("should remove optional translations", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);
    await page.goto("/admin/datasets");
    await expect(page.getByTestId("admin.datasets.page")).toBeVisible();
    await page.getByTestId("app.datatable.search-input").fill(DATASET_NAME);
    await page.getByRole("link", { name: DATASET_NAME }).click();
    await page.waitForURL("**/admin/datasets/**");
    await page.getByTestId("app.datatable.search-input").click();
    await page.getByTestId("app.datatable.search-input").fill("age");
    await page.getByTestId("app.admin.dataset-variable.edit-age").waitFor({ state: "visible", timeout: 5000 });
    await page.getByTestId("app.admin.dataset-variable.edit-age").click();

    const variableLabelsGroup = page.getByRole("group").filter({ hasText: "Variable Labels" });
    const defaultLabelInput = variableLabelsGroup.getByRole("textbox", { name: /Default Label/i });
    const germanInput = variableLabelsGroup.getByRole("textbox", { name: /German/i });
    const englishInput = variableLabelsGroup.getByRole("textbox", { name: /English/i });

    const originalDefault = await defaultLabelInput.inputValue();
    const originalGerman = await germanInput.inputValue();
    const originalEnglish = await englishInput.inputValue();

    await defaultLabelInput.fill("Test Label");
    await germanInput.fill("Deutsches Label");
    await englishInput.fill("English Label");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByTestId("app.datatable.search-input")).toBeVisible();

    await page.getByTestId("app.datatable.search-input").click();
    await page.getByTestId("app.datatable.search-input").fill("age");
    await page.getByTestId("app.admin.dataset-variable.edit-age").waitFor({ state: "visible", timeout: 5000 });
    await page.getByTestId("app.admin.dataset-variable.edit-age").click();

    const variableLabelsGroup2 = page.getByRole("group").filter({ hasText: "Variable Labels" });
    const germanInput2 = variableLabelsGroup2.getByRole("textbox", { name: /German/i });
    const englishInput2 = variableLabelsGroup2.getByRole("textbox", { name: /English/i });

    await expect(germanInput2).toHaveValue("Deutsches Label");
    await expect(englishInput2).toHaveValue("English Label");

    await germanInput2.clear();
    await englishInput2.clear();
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByTestId("app.datatable.search-input")).toBeVisible();

    await page.getByTestId("app.datatable.search-input").click();
    await page.getByTestId("app.datatable.search-input").fill("age");
    await page.getByTestId("app.admin.dataset-variable.edit-age").waitFor({ state: "visible", timeout: 5000 });
    await page.getByTestId("app.admin.dataset-variable.edit-age").click();

    const variableLabelsGroup3 = page.getByRole("group").filter({ hasText: "Variable Labels" });
    const defaultLabelInput3 = variableLabelsGroup3.getByRole("textbox", { name: /Default Label/i });
    const germanInput3 = variableLabelsGroup3.getByRole("textbox", { name: /German/i });
    const englishInput3 = variableLabelsGroup3.getByRole("textbox", { name: /English/i });

    await expect(defaultLabelInput3).toHaveValue("Test Label");
    await expect(germanInput3).toHaveValue("");
    await expect(englishInput3).toHaveValue("");

    await defaultLabelInput3.fill(originalDefault);
    await germanInput3.fill(originalGerman);
    await englishInput3.fill(originalEnglish);
    await page.getByRole("button", { name: "Save changes" }).click();
  });

  test("should edit existing variable labels", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);
    await page.goto("/admin/datasets");
    await expect(page.getByTestId("admin.datasets.page")).toBeVisible();
    await page.getByTestId("app.datatable.search-input").fill(DATASET_NAME);
    await page.getByRole("link", { name: DATASET_NAME }).click();
    await page.waitForURL("**/admin/datasets/**");
    await page.getByTestId("app.datatable.search-input").click();
    await page.getByTestId("app.datatable.search-input").fill("age");
    await page.getByTestId("app.admin.dataset-variable.edit-age").waitFor({ state: "visible", timeout: 5000 });
    await page.getByTestId("app.admin.dataset-variable.edit-age").click();

    const variableLabelsGroup = page.getByRole("group").filter({ hasText: "Variable Labels" });
    const defaultLabelInput = variableLabelsGroup.getByRole("textbox", { name: /Default Label/i });
    const germanInput = variableLabelsGroup.getByRole("textbox", { name: /German/i });

    const originalDefault = await defaultLabelInput.inputValue();
    const originalGerman = await germanInput.inputValue();
    const originalEnglish = await variableLabelsGroup.getByRole("textbox", { name: /English/i }).inputValue();

    await defaultLabelInput.fill("Original Label");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByTestId("app.datatable.search-input")).toBeVisible();

    await page.getByTestId("app.datatable.search-input").click();
    await page.getByTestId("app.datatable.search-input").fill("age");
    await page.getByTestId("app.admin.dataset-variable.edit-age").waitFor({ state: "visible", timeout: 5000 });
    await page.getByTestId("app.admin.dataset-variable.edit-age").click();

    const variableLabelsGroup2 = page.getByRole("group").filter({ hasText: "Variable Labels" });
    const defaultLabelInput2 = variableLabelsGroup2.getByRole("textbox", { name: /Default Label/i });
    await expect(defaultLabelInput2).toHaveValue("Original Label");

    await defaultLabelInput2.fill("Updated Label");
    const germanInput2 = variableLabelsGroup2.getByRole("textbox", { name: /German/i });
    await germanInput2.fill("Aktualisiertes Label");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByTestId("app.datatable.search-input")).toBeVisible();

    await page.getByTestId("app.datatable.search-input").click();
    await page.getByTestId("app.datatable.search-input").fill("age");
    await page.getByTestId("app.admin.dataset-variable.edit-age").waitFor({ state: "visible", timeout: 5000 });
    await page.getByTestId("app.admin.dataset-variable.edit-age").click();

    const variableLabelsGroup3 = page.getByRole("group").filter({ hasText: "Variable Labels" });
    const defaultLabelInput3 = variableLabelsGroup3.getByRole("textbox", { name: /Default Label/i });
    const germanInput3 = variableLabelsGroup3.getByRole("textbox", { name: /German/i });

    await expect(defaultLabelInput3).toHaveValue("Updated Label");
    await expect(germanInput3).toHaveValue("Aktualisiertes Label");

    await germanInput3.fill("Geändertes Label");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByTestId("app.datatable.search-input")).toBeVisible();

    await page.getByTestId("app.datatable.search-input").click();
    await page.getByTestId("app.datatable.search-input").fill("age");
    await page.getByTestId("app.admin.dataset-variable.edit-age").waitFor({ state: "visible", timeout: 5000 });
    await page.getByTestId("app.admin.dataset-variable.edit-age").click();

    const variableLabelsGroup4 = page.getByRole("group").filter({ hasText: "Variable Labels" });
    const germanInput4 = variableLabelsGroup4.getByRole("textbox", { name: /German/i });
    await expect(germanInput4).toHaveValue("Geändertes Label");

    const defaultLabelInput4 = variableLabelsGroup4.getByRole("textbox", { name: /Default Label/i });
    const englishInput4 = variableLabelsGroup4.getByRole("textbox", { name: /English/i });

    await defaultLabelInput4.fill(originalDefault);
    await germanInput4.fill(originalGerman);
    await englishInput4.fill(originalEnglish);
    await page.getByRole("button", { name: "Save changes" }).click();
  });

  test("should display label field as readonly/disabled", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);
    await page.goto("/admin/datasets");
    await expect(page.getByTestId("admin.datasets.page")).toBeVisible();
    await page.getByTestId("app.datatable.search-input").fill(DATASET_NAME);
    await page.getByRole("link", { name: DATASET_NAME }).click();
    await page.waitForURL("**/admin/datasets/**");
    await page.getByTestId("app.datatable.search-input").click();
    await page.getByTestId("app.datatable.search-input").fill("age");
    await page.getByTestId("app.admin.dataset-variable.edit-age").waitFor({ state: "visible", timeout: 5000 });
    await page.getByTestId("app.admin.dataset-variable.edit-age").click();

    const labelInput = page.getByTestId("app.admin.dataset-variable.label-input");
    await expect(labelInput).toBeDisabled();
    await expect(labelInput).not.toHaveValue("");
  });
});
