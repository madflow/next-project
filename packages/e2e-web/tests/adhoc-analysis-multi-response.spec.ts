import { type Locator, expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

async function expectCompactSingleBarLayout(chartContent: Locator) {
  const chart = chartContent.locator("[data-slot='chart']");
  await expect(chart).toHaveAttribute("data-chart-height", "100");
  await expect(chart).toHaveAttribute("data-chart-bar-size", "36");
  await chart.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  );

  const geometry = await chart.evaluate((element) => {
    const bars = Array.from(
      element.querySelectorAll<SVGRectElement>(".recharts-bar-rectangle .recharts-rectangle")
    ).map((bar) => bar.getBoundingClientRect());
    const plotBorders = Array.from(element.querySelectorAll<SVGLineElement>(".recharts-cartesian-grid-horizontal line"))
      .map((line) => line.getBoundingClientRect().top)
      .sort((first, second) => first - second);
    const bar = bars[0];

    return {
      chartHeight: element.getBoundingClientRect().height,
      barHeights: bars.map(({ height }) => height),
      edgeGaps:
        bar && plotBorders.length >= 2
          ? [bar.top - (plotBorders[0] ?? bar.top), (plotBorders.at(-1) ?? bar.bottom) - bar.bottom]
          : [],
    };
  });

  expect(geometry.chartHeight).toBe(100);
  expect(geometry.barHeights).toEqual([36]);
  expect(geometry.edgeGaps).toHaveLength(2);
  expect(Math.max(...geometry.edgeGaps) - Math.min(...geometry.edgeGaps)).toBeLessThanOrEqual(1);
  expect(geometry.edgeGaps.every((gap) => Math.abs(gap - 8) <= 1)).toBe(true);
}

async function expectUniformMultiResponseBarSpacing(multiResponseChart: Locator) {
  const chart = multiResponseChart.locator("[data-slot='chart']");
  await expect(chart).toHaveAttribute("data-chart-row-height", /\d+/);
  await chart.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  );

  const geometry = await chart.evaluate((element) => {
    const bars = Array.from(element.querySelectorAll<SVGRectElement>(".recharts-bar-rectangle .recharts-rectangle"))
      .map((bar) => bar.getBoundingClientRect())
      .sort((first, second) => first.top - second.top);

    return {
      configuredGap:
        Number(element.getAttribute("data-chart-row-height")) - Number(element.getAttribute("data-chart-bar-size")),
      gaps: bars.slice(1).map((bar, index) => bar.top - (bars[index]?.bottom ?? bar.top)),
    };
  });

  expect(geometry.configuredGap).toBe(8);
  expect(geometry.gaps.length).toBeGreaterThan(0);
  expect(Math.max(...geometry.gaps) - Math.min(...geometry.gaps)).toBeLessThanOrEqual(1);
  expect(Math.max(...geometry.gaps)).toBeLessThanOrEqual(9);
}

test.describe("Adhoc Analysis - Multi-Response Variableset", () => {
  test("should render child multi-response summary charts when selecting their parent variableset", async ({
    page,
  }) => {
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);

    await page.goto("/project/test-project/adhoc");
    await expect(page.getByTestId("app.project.adhoc")).toBeVisible();

    await page.getByTestId("app.dropdown.dataset.trigger").click();
    await page.getByText("Test Dataset").click();
    await expect(page.getByTestId("app.dropdown.dataset.trigger")).toContainText("Test Dataset");

    await page.getByTestId("variable-group-Technology and Communication").click();

    const multiResponseCharts = page.getByTestId("multi-response-chart");
    await expect(multiResponseCharts).toHaveCount(2, { timeout: 5000 });
    await expect(multiResponseCharts.nth(0)).toContainText("Communication Services");
    await expect(multiResponseCharts.nth(1)).toContainText("Home Technology Ownership");
  });

  test("should select Informationsquellen variableset and display aggregated multi-response chart", async ({
    page,
  }) => {
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

    // Verify dataset is selected
    const datasetTrigger = page.getByTestId("app.dropdown.dataset.trigger");
    await expect(datasetTrigger).toContainText("SPSS Beispielumfrage");

    // Wait for variable groups to load

    // "Informationsquellen" is a child of "Mediennutzung" — expand the parent first
    const mediennutzungExpandButton = page.getByTestId("variable-group-expand-Mediennutzung");
    await expect(mediennutzungExpandButton).toBeVisible({ timeout: 5000 });
    await mediennutzungExpandButton.click();

    // Find "Informationsquellen" variable group and wait for it to be visible
    const informationsquellenGroup = page.getByTestId("variable-group-Informationsquellen");

    // Verify the group exists
    await expect(informationsquellenGroup).toBeVisible({ timeout: 5000 });

    // Click on the Informationsquellen variableset to select it
    await informationsquellenGroup.click();

    // Wait for the multi-response chart to load

    // Assert that the multi-response chart is displayed
    const multiResponseChart = page.getByTestId("multi-response-chart");
    await expect(multiResponseChart).toBeVisible({ timeout: 5000 });

    // Verify the chart title contains "Informationsquellen"
    await expect(multiResponseChart).toContainText("Informationsquellen");

    // Verify the chart has content (ChartContainer with BarChart)
    const chartContainer = multiResponseChart.locator('[class*="recharts"]').first();
    await expect(chartContainer).toBeVisible();

    // Additional verification: Check if the chart displays the expected variables
    // The multi-response chart should show news1-news5 variables
    // Note: The actual labels might be different from variable names
    // We just verify that there are multiple bars in the chart (horizontal bar chart)
    const bars = multiResponseChart.locator("svg .recharts-bar-rectangle");
    const barCount = await bars.count();

    // We expect at least one bar to be present
    expect(barCount).toBeGreaterThan(0);
    await expectUniformMultiResponseBarSpacing(multiResponseChart);

    // Verify that there's a download button in the footer
    const downloadButton = multiResponseChart.getByRole("button");
    await expect(downloadButton).toBeVisible();
  });

  test("should expand Informationsquellen group and select individual variable", async ({ page }) => {
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

    // Verify dataset is selected
    const datasetTrigger = page.getByTestId("app.dropdown.dataset.trigger");
    await expect(datasetTrigger).toContainText("SPSS Beispielumfrage");

    // Wait for variable groups to load

    // "Informationsquellen" is a child of "Mediennutzung" — expand the parent first
    const mediennutzungExpandButton = page.getByTestId("variable-group-expand-Mediennutzung");
    await expect(mediennutzungExpandButton).toBeVisible({ timeout: 5000 });
    await mediennutzungExpandButton.click();

    // Find "Informationsquellen" variable group
    const informationsquellenGroup = page.getByTestId("variable-group-Informationsquellen");
    await expect(informationsquellenGroup).toBeVisible({ timeout: 5000 });

    // Use dedicated data-testid for the expand button
    const expandButton = page.getByTestId("variable-group-expand-Informationsquellen");

    // Click to expand the group
    await expandButton.click();

    const newsVariable = page.getByTestId("variable-item-news5");
    await expect(newsVariable).toBeVisible({ timeout: 3000 });
    await newsVariable.click();

    const chartContent = page.getByTestId("chart-content-horizontalBar");
    await expect(chartContent).toBeVisible({ timeout: 5000 });
    await expectCompactSingleBarLayout(chartContent);

    const variablesetHeader = page.getByRole("heading", { name: "Informationsquellen", level: 2 }).locator("..");
    const chartCard = chartContent.locator("xpath=ancestor::*[@data-slot='card']");
    const [headerBounds, cardBounds] = await Promise.all([variablesetHeader.boundingBox(), chartCard.boundingBox()]);
    expect(headerBounds).not.toBeNull();
    expect(cardBounds).not.toBeNull();
    expect(Math.round((cardBounds?.y ?? 0) - ((headerBounds?.y ?? 0) + (headerBounds?.height ?? 0)))).toBe(16);

    await page.setViewportSize({ width: 390, height: 844 });
    await expectCompactSingleBarLayout(chartContent);
  });
});
