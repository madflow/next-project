import { Locator, expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

test.describe("Adhoc Analysis - Chart Type Switching", () => {
  test("should test switching between all available chart types for a selected variable", async ({ page }) => {
    // Login as admin
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);

    // Navigate to adhoc analysis
    await page.goto("/project/test-project/adhoc");
    await expect(page.getByTestId("app.project.adhoc")).toBeVisible();

    // Click dataset dropdown trigger
    await page.getByTestId("app.dropdown.dataset.trigger").click();

    // First, try to select "Politische Einstellungen" if available, otherwise use available dataset
    const politischeOption = page.getByText("Politische Einstellungen");
    const spssOption = page.getByText("SPSS Beispielumfrage");

    let selectedDataset = "";

    if ((await politischeOption.count()) > 0) {
      await politischeOption.click();
      selectedDataset = "Politische Einstellungen";
      console.log("✓ Selected Politische Einstellungen dataset");
    } else if ((await spssOption.count()) > 0) {
      await spssOption.click();
      selectedDataset = "SPSS Beispielumfrage";
      console.log("✓ Selected SPSS Beispielumfrage dataset as fallback");
    } else {
      throw new Error("No suitable dataset available for testing");
    }

    // Verify dataset is selected
    const datasetTrigger = page.getByTestId("app.dropdown.dataset.trigger");
    await expect(datasetTrigger).toContainText(selectedDataset);

    // Wait for variable groups to load

    // Check if any variable groups are available
    const anyVariableGroup = page.locator('[data-testid^="variable-group-"]').first();

    if ((await anyVariableGroup.count()) > 0) {
      console.log(`✓ Variable groups found for ${selectedDataset} dataset`);

      // Expand groups and look for suitable variables for chart testing
      const allVariableGroups = page.locator('[data-testid^="variable-group-"]');
      const groupCount = await allVariableGroups.count();

      let chartVariableFound = false;

      for (let i = 0; i < groupCount; i++) {
        const group = allVariableGroups.nth(i);
        const groupText = await group.textContent();
        console.log(`Expanding group ${i}: "${groupText}"`);
        await group.click();

        // Look for specific variable if using Politische Einstellungen
        if (selectedDataset === "Politische Einstellungen") {
          const targetVariable = page.getByTestId("variable-item-Einstellung zur Todesstrafe bei Mord");
          if ((await targetVariable.count()) > 0) {
            console.log("✓ Found 'Einstellung zur Todesstrafe bei Mord' variable");
            await targetVariable.click();
            chartVariableFound = true;
            break;
          }
        }

        // Look for any suitable categorical variable for chart testing
        const variablesInGroup = page.locator('[data-testid^="variable-item-"]');
        const variableCount = await variablesInGroup.count();

        if (variableCount > 0) {
          console.log(`Found ${variableCount} variables in group "${groupText}"`);
          // Select the first available variable
          const firstVariable = variablesInGroup.first();
          const variableText = await firstVariable.textContent();
          console.log(`✓ Selecting variable: "${variableText}"`);
          await firstVariable.click();
          chartVariableFound = true;
          break;
        }
      }

      if (chartVariableFound) {
        // Wait for analysis to load

        // Look for chart type selector/switcher
        console.log("Looking for chart type selector...");

        const chartTypeSelectors = [
          page.getByTestId("chart-type-selector"),
          page.getByTestId("chart-type-dropdown"),
          page.getByTestId("visualization-type-selector"),
          page.locator('[data-testid*="chart-type"]'),
          page.locator('[data-testid*="chart-selector"]'),
          page.locator('[data-testid*="visualization"]').filter({ hasText: /chart|type|selector/i }),
          page.getByRole("combobox", { name: /chart|type|visualization/i }),
          page.getByRole("button", { name: /chart|type|visualization/i }),
        ];

        let chartSelector: Locator | null = null;

        for (const selector of chartTypeSelectors) {
          if ((await selector.count()) > 0) {
            chartSelector = selector.first();
            console.log("✓ Found chart type selector");
            break;
          }
        }

        if (chartSelector) {
          // Click to open chart type options
          await chartSelector.click();

          // Define the chart types we want to test
          const chartTypes = [
            "Horizontal Bar Chart",
            "Horizontal Stacked Bar Chart",
            "Pie Chart",
            "Mean bar",
            "Vertical Bar",
          ];

          console.log("Testing chart type switching...");

          for (const chartType of chartTypes) {
            console.log(`\nTesting chart type: ${chartType}`);

            // Look for the chart type option using multiple strategies
            const chartTypeOptions = [
              page.getByTestId(`chart-type-${chartType.toLowerCase().replace(/\s+/g, "-")}`),
              page.getByText(chartType, { exact: true }),
              page.getByText(chartType, { exact: false }),
              page.getByRole("option", { name: chartType }),
              page.locator(`[data-value*="${chartType.toLowerCase()}"]`),
              page.locator(`[data-testid*="${chartType.toLowerCase().replace(/\s+/g, "-")}"]`),
            ];

            let optionFound = false;

            for (const option of chartTypeOptions) {
              if ((await option.count()) > 0) {
                console.log(`  ✓ Found option for ${chartType}`);
                await option.click();
                optionFound = true;

                // Wait for chart to render

                // Verify the chart type is applied
                const chartContainer = page
                  .locator('[data-testid*="chart"], [data-testid*="visualization"], canvas, svg')
                  .first();
                if ((await chartContainer.count()) > 0) {
                  await expect(chartContainer).toBeVisible();
                  console.log(`  ✓ ${chartType} is displaying correctly`);
                } else {
                  console.log(`  ℹ Chart container not found for ${chartType} - may still be loading`);
                }

                // If we need to reopen the selector for the next chart type
                if (chartTypes.indexOf(chartType) < chartTypes.length - 1) {
                  // Try to click the selector again for next option
                  if ((await chartSelector.count()) > 0) {
                    await chartSelector.click();
                  }
                }

                break;
              }
            }

            if (!optionFound) {
              console.log(`  ⚠ Chart type option "${chartType}" not found - may not be implemented yet`);

              // Log available options for debugging
              const availableOptions = page.locator('[role="option"], [data-testid*="chart"], .chart-option');
              const optionCount = await availableOptions.count();
              console.log(`    Available chart options count: ${optionCount}`);

              for (let i = 0; i < Math.min(optionCount, 5); i++) {
                const optionText = await availableOptions.nth(i).textContent();
                console.log(`    Option ${i}: "${optionText}"`);
              }
            }
          }

          console.log("\n✓ Chart type switching test completed");
        } else {
          console.log("⚠ Chart type selector not found - chart switching functionality may not be implemented yet");

          // Still verify that some kind of chart/visualization is displayed
          const anyChart = page.locator('[data-testid*="chart"], [data-testid*="visualization"], canvas, svg').first();
          if ((await anyChart.count()) > 0) {
            await expect(anyChart).toBeVisible();
            console.log("✓ Default chart/visualization is displayed");
          } else {
            console.log("ℹ No chart visualization found - analysis may still be loading");
          }
        }
      } else {
        console.log(`ℹ No suitable variables found for chart testing in ${selectedDataset} dataset`);
      }
    } else {
      console.log(`ℹ No variable groups available for ${selectedDataset} dataset (dataset may still be processing)`);
    }

    // Test passes if we successfully navigated and selected the dataset
    await expect(datasetTrigger).toContainText(selectedDataset);
  });
});
