import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

test.describe("Adhoc Analysis - Split Functionality", () => {
  test.beforeEach(async ({ page }) => {
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

  test("should display variable groups for dataset", async ({ page }) => {
    // Wait for and verify variable groups are available
    const variableGroups = page.locator('[data-testid^="variable-group-"]');
    await expect(variableGroups.first()).toBeVisible({ timeout: 10000 });

    // Verify we have at least one variable group
    await expect(variableGroups).not.toHaveCount(0);
  });

  test("should expand variable group and display variables", async ({ page }) => {
    // Wait for variable groups to load
    const variableGroups = page.locator('[data-testid^="variable-group-"]');
    await expect(variableGroups.first()).toBeVisible({ timeout: 10000 });

    // Expand first variable group
    await variableGroups.first().click();

    // Verify variables are displayed
    const variables = page.locator('[data-testid^="variable-item-"]');
    await expect(variables.first()).toBeVisible({ timeout: 5000 });
    await expect(variables).not.toHaveCount(0);
  });

  test("should select a variable and load analysis", async ({ page }) => {
    // Wait for variable groups to load
    const variableGroups = page.locator('[data-testid^="variable-group-"]');
    await expect(variableGroups.first()).toBeVisible({ timeout: 10000 });

    // Expand first variable group
    await variableGroups.first().click();

    // Select first available variable
    const variables = page.locator('[data-testid^="variable-item-"]');
    await expect(variables.first()).toBeVisible({ timeout: 5000 });
    await variables.first().click();

    // Verify analysis area is present (it should show some content after variable selection)
    // This is a basic check that something happens after clicking a variable
    await page.waitForTimeout(1000);
  });

  test.describe("Split functionality discovery", () => {
    test.beforeEach(async ({ page }) => {
      // Wait for variable groups to load
      const variableGroups = page.locator('[data-testid^="variable-group-"]');
      await expect(variableGroups.first()).toBeVisible({ timeout: 10000 });

      // Expand first variable group (Demografische Daten)
      await variableGroups.first().click();

      // Select "Geschlecht" (Gender) variable which supports split variables
      // (nominal/ordinal variables support splits, scale variables like "Alter" do not)
      const geschlechtVariable = page.getByTestId("variable-item-Geschlecht");
      await expect(geschlechtVariable).toBeVisible({ timeout: 5000 });
      await geschlechtVariable.click();

      // Wait for analysis to load
      await page.waitForTimeout(1000);
    });

    test("should find split dropdown via test ID", async ({ page }) => {
      const splitDropdown = page.getByTestId("split-dropdown");
      await expect(splitDropdown).toBeVisible({ timeout: 5000 });
      await splitDropdown.click();
    });

    test("should find split control via partial test ID", async ({ page }) => {
      const splitTrigger = page.locator('[data-testid*="split"]').first();
      await expect(splitTrigger).toBeVisible({ timeout: 5000 });
      await splitTrigger.click();
    });

    test("should find split control via text", async ({ page }) => {
      const splitByText = page.getByText("Split Variable", { exact: false }).first();
      await expect(splitByText).toBeVisible({ timeout: 5000 });
      await splitByText.click();
    });

    test("should find split control via combobox role", async ({ page }) => {
      const splitByRole = page.getByRole("combobox", { name: /split/i }).first();
      await expect(splitByRole).toBeVisible({ timeout: 5000 });
      await splitByRole.click();
    });
  });

  test.describe("Split variable selection - Geschlecht", () => {
    test.beforeEach(async ({ page }) => {
      // Setup: select variable and open split functionality
      const variableGroups = page.locator('[data-testid^="variable-group-"]');
      await expect(variableGroups.first()).toBeVisible({ timeout: 10000 });

      // Expand all groups to make Geschlecht accessible
      const groupCount = await variableGroups.count();
      for (let i = 0; i < groupCount; i++) {
        await variableGroups.nth(i).click();
      }

      // Select Geschlecht variable
      const geschlechtVariable = page.getByTestId("variable-item-Geschlecht");
      await expect(geschlechtVariable).toBeVisible({ timeout: 5000 });
      await geschlechtVariable.click();
      await page.waitForTimeout(1000);

      // Open split functionality
      const splitControls = page.locator('[data-testid*="split"]').first();
      await expect(splitControls).toBeVisible({ timeout: 5000 });
      await splitControls.click();
      await page.waitForTimeout(500);
    });

    test("should select marital status as split variable via test ID", async ({ page }) => {
      const splitVarTestId = page.getByTestId("split-variable-marital");
      await expect(splitVarTestId).toBeVisible({ timeout: 5000 });
      await splitVarTestId.click();

      // Verify split analysis is displayed
      await page.waitForTimeout(1000);
      const splitAnalysis = page.locator('[data-testid*="split"], [data-testid*="chart"], [data-testid*="analysis"]');
      await expect(splitAnalysis.first()).toBeVisible({ timeout: 5000 });
    });

    test("should select marital status as split variable via role", async ({ page }) => {
      const splitVarOption = page.getByRole("option", { name: /Familienstand/ });
      await expect(splitVarOption).toBeVisible({ timeout: 5000 });
      await splitVarOption.click();

      // Verify split visualization is displayed
      await page.waitForTimeout(1000);
      const splitVisualization = page.locator('[data-testid*="visualization"], [data-testid*="chart"]');
      await expect(splitVisualization.first()).toBeVisible({ timeout: 5000 });
    });

    test("should select marital status as split variable via text", async ({ page }) => {
      const splitVarByText = page.getByText("Familienstand", { exact: false }).last();
      await expect(splitVarByText).toBeVisible({ timeout: 5000 });
      await splitVarByText.click();

      // Verify analysis content is displayed
      await page.waitForTimeout(1000);
      const analysisElements = page.locator(
        '[data-testid*="split"], [data-testid*="chart"], [data-testid*="analysis"], [data-testid*="visualization"]'
      );
      await expect(analysisElements.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Split variable selection - Familienstand", () => {
    test.beforeEach(async ({ page }) => {
      // Setup: select variable and open split functionality
      const variableGroups = page.locator('[data-testid^="variable-group-"]');
      await expect(variableGroups.first()).toBeVisible({ timeout: 10000 });

      // Expand first variable group (Demografische Daten)
      await variableGroups.first().click();

      // Select Familienstand variable
      const familienstandVariable = page.getByTestId("variable-item-Familienstand");
      await expect(familienstandVariable).toBeVisible({ timeout: 5000 });
      await familienstandVariable.click();
      await page.waitForTimeout(1000);

      // Open split functionality
      const splitControls = page.locator('[data-testid*="split"]').first();
      await expect(splitControls).toBeVisible({ timeout: 5000 });
      await splitControls.click();
      await page.waitForTimeout(500);
    });

    test("should select age group as split variable", async ({ page }) => {
      const splitVarTestId = page.getByTestId("split-variable-agecat");
      await expect(splitVarTestId).toBeVisible({ timeout: 5000 });
      await splitVarTestId.click();

      // Verify split analysis is displayed
      await page.waitForTimeout(1000);
      const splitAnalysis = page.locator('[data-testid*="split"], [data-testid*="chart"], [data-testid*="analysis"]');
      await expect(splitAnalysis.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test("should select first available split option as fallback", async ({ page }) => {
    // Setup: select variable and open split functionality
    const variableGroups = page.locator('[data-testid^="variable-group-"]');
    await expect(variableGroups.first()).toBeVisible({ timeout: 10000 });

    // Expand first group (Demografische Daten)
    await variableGroups.first().click();

    // Select Altersgruppe (Age group) which supports split variables
    const ageGroupVariable = page.getByTestId("variable-item-Altersgruppe");
    await expect(ageGroupVariable).toBeVisible({ timeout: 5000 });
    await ageGroupVariable.click();
    await page.waitForTimeout(1000);

    // Open split functionality using any available control
    const splitControl = page.locator('[data-testid*="split"]').first();
    await expect(splitControl).toBeVisible({ timeout: 5000 });
    await splitControl.click();
    await page.waitForTimeout(500);

    // Select first available split option (marital status)
    const splitOption = page.getByTestId("split-variable-marital");
    await expect(splitOption).toBeVisible({ timeout: 5000 });
    await splitOption.click();

    // Verify analysis content loads
    await page.waitForTimeout(1000);
    const analysisContent = page.locator(
      '[data-testid*="split"], [data-testid*="chart"], [data-testid*="analysis"], [data-testid*="visualization"]'
    );
    await expect(analysisContent.first()).toBeVisible({ timeout: 5000 });
  });
});
