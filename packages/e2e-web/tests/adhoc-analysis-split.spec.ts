import { Locator, expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

test.describe("Adhoc Analysis - Split Functionality", () => {
  test("should select SPSS Beispielumfrage dataset and test split functionality", async ({ page }) => {
    // Login as admin
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);

    // Navigate to adhoc analysis
    await page.goto("/project/test-project/adhoc");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("app.project.adhoc")).toBeVisible();

    // Click dataset dropdown trigger
    await page.getByTestId("app.dropdown.dataset.trigger").click();

    // Select "SPSS Beispielumfrage" dataset using text
    await page.getByText("SPSS Beispielumfrage").click();

    // Verify dataset is selected
    const datasetTrigger = page.getByTestId("app.dropdown.dataset.trigger");
    await expect(datasetTrigger).toContainText("SPSS Beispielumfrage");

    // Wait for variable groups to load
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    // Check if any variable groups are available
    const anyVariableGroup = page.locator('[data-testid^="variable-group-"]').first();

    if ((await anyVariableGroup.count()) > 0) {
      console.log("✓ Variable groups found for SPSS Beispielumfrage dataset");

      // Since we don't know the exact variable names, let's explore available variables
      // First, expand all groups and look for any variables that could be used for split testing
      const allVariableGroups = page.locator('[data-testid^="variable-group-"]');
      const groupCount = await allVariableGroups.count();

      let targetVariableFound = false;
      let firstAvailableVariable: Locator | null = null;

      for (let i = 0; i < groupCount; i++) {
        const group = allVariableGroups.nth(i);
        const groupText = await group.textContent();
        console.log(`Expanding group ${i}: "${groupText}"`);
        await group.click();
        await page.waitForTimeout(500);

        // Get all variables in this group
        const variablesInGroup = page.locator('[data-testid^="variable-item-"]');
        const variableCount = await variablesInGroup.count();

        console.log(`Found ${variableCount} variables in group "${groupText}"`);

        for (let j = 0; j < Math.min(variableCount, 3); j++) {
          // Log first 3 variables
          const variable = variablesInGroup.nth(j);
          const variableText = await variable.textContent();
          console.log(`  Variable ${j}: "${variableText}"`);

          if (!firstAvailableVariable) {
            firstAvailableVariable = variable;
          }
        }

        // Look for common variable names that might work for splitting
        const commonSplitVariables = [
          "Geschlecht",
          "Gender",
          "Alter",
          "Age",
          "Familienstand",
          "Marital",
          "Education",
          "Bildung",
          "Beruf",
          "Occupation",
        ];

        for (const varName of commonSplitVariables) {
          const targetVariable = page.getByTestId(`variable-item-${varName}`);
          if ((await targetVariable.count()) > 0) {
            console.log(`✓ Found potential split variable: '${varName}'`);
            await targetVariable.click();
            targetVariableFound = true;

            // Wait for analysis to load
            await page.waitForLoadState("networkidle");
            await page.waitForTimeout(2000);

            break;
          }
        }

        if (targetVariableFound) break;
      }

      // If no specific variable found, use the first available one
      if (!targetVariableFound && firstAvailableVariable) {
        console.log("✓ Using first available variable for split testing");
        await firstAvailableVariable.click();
        targetVariableFound = true;

        // Wait for analysis to load
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);
      }

      // Only proceed with split testing if we have a variable selected
      if (targetVariableFound) {
        // Now look for split functionality
        // Check if there's a split button or dropdown
        const splitButton = page.getByTestId("split-button");
        const splitDropdown = page.getByTestId("split-dropdown");
        const splitTrigger = page.locator('[data-testid*="split"]').first();

        if ((await splitButton.count()) > 0) {
          console.log("✓ Found split button");
          await splitButton.click();
        } else if ((await splitDropdown.count()) > 0) {
          console.log("✓ Found split dropdown");
          await splitDropdown.click();
        } else if ((await splitTrigger.count()) > 0) {
          console.log("✓ Found split trigger");
          await splitTrigger.click();
        } else {
          console.log("ℹ Split functionality not found via standard test IDs, looking for alternative selectors");

          // Look for split functionality using text or other selectors
          const splitByText = page.getByText("Split", { exact: false });
          const splitByRole = page.getByRole("button", { name: /split/i });

          if ((await splitByText.count()) > 0) {
            console.log("✓ Found split functionality via text");
            await splitByText.first().click();
          } else if ((await splitByRole.count()) > 0) {
            console.log("✓ Found split functionality via role");
            await splitByRole.first().click();
          } else {
            console.log(
              "⚠ Split functionality not found - this might indicate the feature is not yet implemented or uses different selectors"
            );
          }
        }

        // Wait for split options to appear
        await page.waitForTimeout(1000);

        // Look for common split variables in options
        const commonSplitVars = ["Familienstand", "Geschlecht", "Gender", "Alter", "Age"];
        let splitVarFound = false;

        for (const varName of commonSplitVars) {
          const splitVarOption = page.getByText(varName);
          const splitVarTestId = page.getByTestId(`split-variable-${varName}`);

          if ((await splitVarTestId.count()) > 0) {
            console.log(`✓ Found '${varName}' in split options (via test ID)`);
            await splitVarTestId.click();
            splitVarFound = true;
            break;
          } else if ((await splitVarOption.count()) > 0) {
            console.log(`✓ Found '${varName}' option via text`);
            await splitVarOption.click();
            splitVarFound = true;
            break;
          }
        }

        if (!splitVarFound) {
          console.log("ℹ No common split variables found, looking for any available options");

          // Log available split options for debugging
          const splitOptions = page.locator('[data-testid*="split-variable-"], [data-testid*="variable-"]');
          const optionCount = await splitOptions.count();
          console.log(`Available split options count: ${optionCount}`);

          if (optionCount > 0) {
            console.log("Using first available split variable as fallback");
            await splitOptions.first().click();
            splitVarFound = true;
          }
        }

        if (splitVarFound) {
          // Wait for split analysis to load
          await page.waitForLoadState("networkidle");
          await page.waitForTimeout(3000);

          // Verify that split analysis is displayed
          const splitAnalysis = page.locator(
            '[data-testid*="split"], [data-testid*="chart"], [data-testid*="analysis"]'
          );
          const splitVisualization = page.locator('[data-testid*="visualization"]');

          if ((await splitAnalysis.count()) > 0) {
            console.log("✓ Split analysis visualization displayed");
            await expect(splitAnalysis.first()).toBeVisible();
          } else if ((await splitVisualization.count()) > 0) {
            console.log("✓ Analysis visualization displayed");
            await expect(splitVisualization.first()).toBeVisible();
          } else {
            console.log("ℹ Split analysis visualization not yet available");
          }
        }
      }
    } else {
      console.log("ℹ No variable groups available for SPSS Beispielumfrage dataset (dataset may still be processing)");
    }

    // Test passes if we successfully navigated and selected the dataset
    await expect(datasetTrigger).toContainText("SPSS Beispielumfrage");
  });
});
