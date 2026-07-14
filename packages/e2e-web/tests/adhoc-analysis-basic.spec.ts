import { type Page, expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

async function expectUniformHorizontalBarSpacing(page: Page) {
  const chartContents = page.getByTestId("chart-content-horizontalBar");
  await expect(chartContents).toHaveCount(4, { timeout: 5000 });
  await chartContents
    .first()
    .locator("[data-slot='chart']")
    .evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
    );

  const charts = await chartContents.evaluateAll((contents) =>
    contents.map((content) => {
      const chart = content.querySelector<HTMLElement>("[data-slot='chart']");
      if (!chart) {
        throw new Error("Chart container not found");
      }

      const chartBounds = chart.getBoundingClientRect();
      const bars = Array.from(chart.querySelectorAll<SVGRectElement>(".recharts-bar-rectangle .recharts-rectangle"))
        .map((bar) => bar.getBoundingClientRect())
        .sort((first, second) => first.top - second.top);
      const plotBorders = Array.from(chart.querySelectorAll<SVGLineElement>(".recharts-cartesian-grid-horizontal line"))
        .map((line) => line.getBoundingClientRect().top)
        .sort((first, second) => first - second);
      const firstBar = bars[0];
      const lastBar = bars.at(-1);

      return {
        actualChartHeight: chartBounds.height,
        barCount: bars.length,
        barHeights: bars.map((bar) => bar.height),
        configuredBarSize: Number(chart.dataset.chartBarSize),
        configuredChartHeight: Number(chart.dataset.chartHeight),
        configuredRowHeight: Number(chart.dataset.chartRowHeight),
        edgeGaps:
          firstBar && lastBar && plotBorders.length >= 2
            ? [firstBar.top - (plotBorders[0] ?? firstBar.top), (plotBorders.at(-1) ?? lastBar.bottom) - lastBar.bottom]
            : [],
        gaps: bars.slice(1).map((bar, index) => bar.top - (bars[index]?.bottom ?? bar.top)),
      };
    })
  );

  expect(charts.map((chart) => chart.barCount).sort((first, second) => first - second)).toEqual([2, 4, 5, 6]);

  for (const chart of charts) {
    expect(chart.configuredRowHeight - chart.configuredBarSize).toBe(8);
    expect(chart.configuredChartHeight).toBe(chart.barCount * chart.configuredRowHeight + 56);
    expect(chart.actualChartHeight).toBe(chart.configuredChartHeight);
    expect(chart.edgeGaps).toHaveLength(2);
    expect(chart.gaps).toHaveLength(chart.barCount - 1);
    expect(Math.max(...chart.edgeGaps, ...chart.gaps) - Math.min(...chart.edgeGaps, ...chart.gaps)).toBeLessThanOrEqual(
      1
    );
    expect(Math.max(...chart.gaps) - Math.min(...chart.gaps)).toBeLessThanOrEqual(1);
    expect(chart.barHeights.every((height) => Math.abs(height - chart.configuredBarSize) <= 1)).toBe(true);
  }

  const gaps = charts.flatMap((chart) => chart.gaps);
  expect(Math.max(...gaps) - Math.min(...gaps)).toBeLessThanOrEqual(1);
}

test.describe("Adhoc Analysis - Basic Functionality", () => {
  test("should navigate to adhoc analysis and select SPSS Beispielumfrage dataset", async ({ page }) => {
    // Login as admin
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);

    // Navigate to adhoc analysis
    await page.goto("/project/test-project/adhoc");
    await expect(page.getByTestId("app.project.adhoc")).toBeVisible();

    // Click dataset dropdown trigger
    await page.getByTestId("app.dropdown.dataset.trigger").click();

    // Select "SPSS Beispielumfrage" dataset - MUST exist from seed
    await page.getByText("SPSS Beispielumfrage").click();

    // Verify dataset is selected
    const datasetTrigger = page.getByTestId("app.dropdown.dataset.trigger");
    await expect(datasetTrigger).toContainText("SPSS Beispielumfrage");
  });

  test("should expand Demografische Daten group and display variables", async ({ page }) => {
    // Setup: Login and select dataset
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);
    await page.goto("/project/test-project/adhoc");
    await page.getByTestId("app.dropdown.dataset.trigger").click();
    await page.getByText("SPSS Beispielumfrage").click();

    // Assert "Demografische Daten" group exists (seeded deterministically)
    const demografischeGroup = page.getByTestId("variable-group-Demografische Daten");
    await expect(demografischeGroup).toBeVisible();

    // Expand the group using the expand button
    const expandButton = page.getByTestId("variable-group-expand-Demografische Daten");
    await expandButton.click();

    // Assert specific variables are visible (using variable names from SPSS file)
    await expect(page.getByTestId("variable-item-age")).toBeVisible();
    await expect(page.getByTestId("variable-item-sex")).toBeVisible();
    await expect(page.getByTestId("variable-item-marital")).toBeVisible();
  });

  test("should open the variableset tree when clicking the group name", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);
    await page.goto("/project/test-project/adhoc");
    await page.getByTestId("app.dropdown.dataset.trigger").click();
    await page.getByText("SPSS Beispielumfrage").click();

    const demografischeGroup = page.getByTestId("variable-group-Demografische Daten");
    await expect(demografischeGroup).toBeVisible();
    await demografischeGroup.click();

    await expect(page.getByTestId("variable-item-age")).toBeVisible();
    await expect(page.getByTestId("variable-item-sex")).toBeVisible();
    await expect(page.getByTestId("variable-item-marital")).toBeVisible();
  });

  test("should select Geschlecht variable and display analysis chart", async ({ page }) => {
    // Setup: Login, select dataset, expand group
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);
    await page.goto("/project/test-project/adhoc");
    await page.getByTestId("app.dropdown.dataset.trigger").click();
    await page.getByText("SPSS Beispielumfrage").click();

    // Expand the group using the expand button
    const expandButton = page.getByTestId("variable-group-expand-Demografische Daten");
    await expandButton.click();

    // Select Sex variable (categorical - deterministic)
    const geschlechtVariable = page.getByTestId("variable-item-sex");
    await expect(geschlechtVariable).toBeVisible();
    await geschlechtVariable.click();

    // Assert that a chart is displayed
    // Use a more flexible selector that will match any visible chart
    await expect(page.locator("canvas, svg").first()).toBeVisible({ timeout: 10000 });
  });

  test("keeps horizontal bar spacing consistent across category counts", async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);
    await page.goto("/project/test-project/adhoc");
    await page.getByTestId("app.dropdown.dataset.trigger").click();
    await page.getByText("SPSS Beispielumfrage").click();
    await page.getByTestId("variable-group-Demografische Daten").click();

    await expect(page.getByTestId("chart-content-horizontalBar")).toHaveCount(4, { timeout: 5000 });
    await expectUniformHorizontalBarSpacing(page);

    await page.setViewportSize({ width: 390, height: 844 });
    await expectUniformHorizontalBarSpacing(page);
  });
});
