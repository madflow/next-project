import { expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

test.describe("Adhoc Analysis - Pie Chart Legend Ordering", () => {
  test("should preserve numeric value order in pie chart legend", async ({ page }) => {
    // Login as admin
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);

    // Navigate to adhoc analysis for Test Project
    await page.goto("/project/test-project/adhoc");
    await expect(page.getByTestId("app.project.adhoc")).toBeVisible();

    // Select SPSS Beispielumfrage dataset
    await page.getByTestId("app.dropdown.dataset.trigger").click();
    await page.getByText("SPSS Beispielumfrage").click();

    const datasetTrigger = page.getByTestId("app.dropdown.dataset.trigger");
    await expect(datasetTrigger).toContainText("SPSS Beispielumfrage");

    // Expand "Bildung und Beruf" group
    const bildungGroup = page.getByTestId("variable-group-Bildung und Beruf");
    await expect(bildungGroup).toBeVisible();

    const expandButton = page.getByTestId("variable-group-expand-Bildung und Beruf");
    await expandButton.click();

    // Select "Höchster Abschluss" variable (degree)
    const degreeVariable = page.getByTestId("variable-item-degree");
    await expect(degreeVariable).toBeVisible();
    await degreeVariable.click();

    // Wait for chart type selector to load
    const chartTypeSelector = page.getByTestId("chart-type-selector");
    await expect(chartTypeSelector).toBeVisible();

    // Expected order based on numeric values (0.0, 1.0, 2.0, 3.0, 4.0)
    const expectedOrder = [
      "Niedriger als High School", // 0.0
      "High School", // 1.0
      "Junior College", // 2.0
      "Bachelor", // 3.0
      "Universitätsabschluss", // 4.0
    ];

    // Switch to pie chart
    const pieChartButton = page.getByTestId("chart-type-pie");
    await expect(pieChartButton).toBeVisible();
    await pieChartButton.click();

    // Wait for pie chart to load
    const pieChartContent = page.getByTestId("chart-content-pie");
    await expect(pieChartContent).toBeVisible();

    // Verify the legend order matches the expected numeric order
    // The custom legend uses spans with text-xs class inside divs with items-center gap-1.5
    const legendItems = pieChartContent.locator(".recharts-legend-wrapper span.text-xs");

    // Verify the legend items are in the correct order (sorted by numeric value)
    await expect(legendItems).toHaveText(expectedOrder);
  });
});
