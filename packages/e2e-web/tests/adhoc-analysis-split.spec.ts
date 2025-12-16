import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

test.describe("Adhoc Analysis - Split Functionality", () => {
  test("should select SPSS Beispielumfrage dataset", async ({ page }) => {
    // Login as admin
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);

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
  });

  test("should display variable groups for SPSS Beispielumfrage dataset", async ({ page }) => {
    // Login as admin
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);

    // Navigate to adhoc analysis
    await page.goto("/project/test-project/adhoc");
    await expect(page.getByTestId("app.project.adhoc")).toBeVisible();

    // Click dataset dropdown trigger
    await page.getByTestId("app.dropdown.dataset.trigger").click();

    // Select "SPSS Beispielumfrage" dataset
    await page.getByText("SPSS Beispielumfrage").click();

    // Wait for and verify variable groups are available
    const firstVariableGroup = page.locator('[data-testid^="variable-group-"]').first();
    await expect(firstVariableGroup).toBeVisible();
  });

  test("should select a variable from SPSS Beispielumfrage dataset", async ({ page }) => {
    // Login as admin
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);

    // Navigate to adhoc analysis
    await page.goto("/project/test-project/adhoc");
    await expect(page.getByTestId("app.project.adhoc")).toBeVisible();

    // Click dataset dropdown trigger
    await page.getByTestId("app.dropdown.dataset.trigger").click();

    // Select "SPSS Beispielumfrage" dataset
    await page.getByText("SPSS Beispielumfrage").click();

    // Wait for variable groups to be visible
    const firstVariableGroup = page.locator('[data-testid^="variable-group-"]').first();
    await expect(firstVariableGroup).toBeVisible();

    // Expand the first variable group
    await firstVariableGroup.click();

    // Select the first available variable
    const firstVariable = page.locator('[data-testid^="variable-item-"]').first();
    await expect(firstVariable).toBeVisible();
    await firstVariable.click();

    // Verify analysis loaded (page should still show the dataset)
    const datasetTrigger = page.getByTestId("app.dropdown.dataset.trigger");
    await expect(datasetTrigger).toContainText("SPSS Beispielumfrage");
  });

  test("should select Alter variable for split analysis", async ({ page }) => {
    // Login as admin
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);

    // Navigate to adhoc analysis
    await page.goto("/project/test-project/adhoc");
    await expect(page.getByTestId("app.project.adhoc")).toBeVisible();

    // Click dataset dropdown trigger
    await page.getByTestId("app.dropdown.dataset.trigger").click();

    // Select "SPSS Beispielumfrage" dataset
    await page.getByText("SPSS Beispielumfrage").click();

    // Wait for variable groups
    const firstVariableGroup = page.locator('[data-testid^="variable-group-"]').first();
    await expect(firstVariableGroup).toBeVisible();

    // Expand first group
    await firstVariableGroup.click();

    // Select "Alter" variable specifically
    const alterVariable = page.getByTestId("variable-item-Alter");
    await expect(alterVariable).toBeVisible();
    await alterVariable.click();

    // Verify dataset is still selected
    const datasetTrigger = page.getByTestId("app.dropdown.dataset.trigger");
    await expect(datasetTrigger).toContainText("SPSS Beispielumfrage");
  });

  test("should access split functionality with Familienstand", async ({ page }) => {
    // Login as admin
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);

    // Navigate to adhoc analysis
    await page.goto("/project/test-project/adhoc");
    await expect(page.getByTestId("app.project.adhoc")).toBeVisible();

    // Click dataset dropdown trigger
    await page.getByTestId("app.dropdown.dataset.trigger").click();

    // Select "SPSS Beispielumfrage" dataset
    await page.getByText("SPSS Beispielumfrage").click();

    // Wait for variable groups
    const firstVariableGroup = page.locator('[data-testid^="variable-group-"]').first();
    await expect(firstVariableGroup).toBeVisible();

    // Expand first group
    await firstVariableGroup.click();

    // Select "Alter" variable
    const alterVariable = page.getByTestId("variable-item-Alter");
    await expect(alterVariable).toBeVisible();
    await alterVariable.click();

    // Look for split functionality by text
    const splitText = page.getByText("Familienstand", { exact: true });
    await expect(splitText).toBeVisible();
    await splitText.first().click();

    // Verify dataset is still selected
    const datasetTrigger = page.getByTestId("app.dropdown.dataset.trigger");
    await expect(datasetTrigger).toContainText("SPSS Beispielumfrage");
  });
});
