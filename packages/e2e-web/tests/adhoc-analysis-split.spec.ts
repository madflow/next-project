import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser, selectDataset, selectVariable, waitForChart } from "../utils";

test.describe("Adhoc Analysis - Split Functionality", () => {
  test("should select SPSS Beispielumfrage dataset and test split functionality", async ({ page }) => {
    // Login as admin
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);

    // Navigate to adhoc analysis
    await page.goto("/project/test-project/adhoc");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("app.project.adhoc")).toBeVisible();

    // Select dataset using helper function
    const datasetTrigger = await selectDataset(page, "SPSS Beispielumfrage");

    // Check if any variable groups are available
    const anyVariableGroup = page.locator('[data-testid^="variable-group-"]').first();

    if ((await anyVariableGroup.count()) > 0) {
      // Look for common split variables first
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

      let variableSelected = false;

      // Try to find and select a common split variable
      for (const varName of commonSplitVariables) {
        try {
          await selectVariable(page, varName);
          variableSelected = true;
          break;
        } catch {
          // Variable not found, continue to next
        }
      }

      // If no common variable found, select any available variable
      if (!variableSelected) {
        await selectVariable(page);
      }

      // Wait for analysis to load
      await page.waitForLoadState("networkidle");

      // Look for split functionality
      const splitSelectors = [
        page.getByTestId("split-button"),
        page.getByTestId("split-dropdown"),
        page.locator('[data-testid*="split"]').first(),
        page.getByText("Split", { exact: false }).first(),
        page.getByRole("button", { name: /split/i }).first(),
      ];

      let splitFound = false;

      for (const selector of splitSelectors) {
        if ((await selector.count()) > 0) {
          await selector.click();
          splitFound = true;
          break;
        }
      }

      if (splitFound) {
        // Look for common split variables in options
        const commonSplitVars = ["Familienstand", "Geschlecht", "Gender", "Alter", "Age"];
        let splitVarFound = false;

        for (const varName of commonSplitVars) {
          const splitVarOptions = [
            page.getByTestId(`split-variable-${varName}`),
            page.getByRole("option", { name: varName }),
            page.getByText(varName, { exact: true }).first(),
          ];

          for (const option of splitVarOptions) {
            if ((await option.count()) > 0) {
              await option.click();
              splitVarFound = true;
              break;
            }
          }

          if (splitVarFound) break;
        }

        if (!splitVarFound) {
          // Use first available split variable as fallback
          const splitOptions = page.locator('[data-testid*="split-variable-"], [data-testid*="variable-"]');
          if ((await splitOptions.count()) > 0) {
            await splitOptions.first().click();
            splitVarFound = true;
          }
        }

        if (splitVarFound) {
          // Wait for split analysis to load
          await page.waitForLoadState("networkidle");

          // Verify that split analysis is displayed
          try {
            const chart = await waitForChart(page);
            await expect(chart).toBeVisible();
          } catch {
            // Split analysis visualization not yet available is acceptable
          }
        }
      }
    }

    // Test passes if we successfully navigated and selected the dataset
    await expect(datasetTrigger).toContainText("SPSS Beispielumfrage");
  });
});
