import { type Locator, expect, test } from "@playwright/test";
import { testUsers } from "../config";
import { loginUser } from "../utils";

async function expectAdaptiveHorizontalLayout(matrixChart: Locator) {
  const chart = matrixChart.locator("[data-slot='chart']");
  await expect(chart).toHaveAttribute("data-chart-row-height", /\d+/);
  await chart.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  );

  const geometry = await chart.evaluate((element) => {
    const chartBounds = element.getBoundingClientRect();
    const ticks = Array.from(element.querySelectorAll<SVGTextElement>("text[aria-label]"))
      .map((tick) => tick.getBoundingClientRect())
      .sort((first, second) => first.top - second.top);
    const barHeights = Array.from(
      element.querySelectorAll<SVGRectElement>(".recharts-bar-rectangle .recharts-rectangle")
    )
      .map((bar) => Number(bar.getAttribute("height")))
      .filter((height) => Number.isFinite(height));
    const tolerance = 1;

    return {
      barHeights,
      configuredAxisWidth: Number(element.getAttribute("data-chart-axis-width")),
      configuredBarSize: Number(element.getAttribute("data-chart-bar-size")),
      tickCount: ticks.length,
      ticksDoNotOverlap: ticks.every(
        (tick, index) => index === 0 || tick.top >= (ticks[index - 1]?.bottom ?? tick.top) - tolerance
      ),
      ticksStayInsideChart: ticks.every(
        (tick) =>
          tick.left >= chartBounds.left - tolerance &&
          tick.right <= chartBounds.right + tolerance &&
          tick.top >= chartBounds.top - tolerance &&
          tick.bottom <= chartBounds.bottom + tolerance
      ),
    };
  });

  expect(geometry.tickCount).toBeGreaterThan(0);
  expect(geometry.barHeights.length).toBeGreaterThan(0);
  expect(geometry.configuredAxisWidth).toBeGreaterThan(0);
  expect(geometry.ticksDoNotOverlap).toBe(true);
  expect(geometry.ticksStayInsideChart).toBe(true);
  expect(Math.min(...geometry.barHeights)).toBeGreaterThanOrEqual(20);
  expect(Math.max(...geometry.barHeights)).toBeLessThanOrEqual(36);
  expect(geometry.configuredBarSize).toBeGreaterThanOrEqual(20);
  expect(geometry.configuredBarSize).toBeLessThanOrEqual(36);
}

test.describe("Adhoc Analysis - Matrix Variableset", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await loginUser(page, testUsers.admin.email, testUsers.admin.password);
    await page.goto("/project/test-project/adhoc");
    await expect(page.getByTestId("app.project.adhoc")).toBeVisible();

    await page.getByTestId("app.dropdown.dataset.trigger").click();
    await page.getByText("SPSS Beispielumfrage").click();
    await expect(page.getByTestId("app.dropdown.dataset.trigger")).toContainText("SPSS Beispielumfrage");
  });

  test("renders the shared scale and keeps individual question selection separate", async ({ page }) => {
    await page.getByTestId("variable-group-Zufriedenheit").click();

    const matrixChart = page.getByTestId("matrix-chart");
    await expect(matrixChart).toBeVisible({ timeout: 5000 });
    await expect(matrixChart).toContainText("Zufriedenheit");
    await expect(matrixChart).toContainText("Sehr zufrieden");
    await expect(matrixChart).toContainText("Ziemlich zufrieden");
    await expect(matrixChart).toContainText("Nicht sehr zufrieden");
    await expect(matrixChart).not.toContainText("NZ");
    await expect(matrixChart).not.toContainText("KA");
    await expect(matrixChart).not.toContainText("NA");
    await expect(matrixChart.locator(".recharts-bar-rectangle")).toHaveCount(6);
    await expectAdaptiveHorizontalLayout(matrixChart);

    await page.setViewportSize({ width: 390, height: 844 });
    await expectAdaptiveHorizontalLayout(matrixChart);

    await page.setViewportSize({ width: 1280, height: 720 });
    const happyVariable = page.getByTestId("variable-item-happy");
    await expect(happyVariable).toBeVisible();
    await happyVariable.click();

    await expect(matrixChart).toHaveCount(0);
    await expect(page.locator(".recharts-wrapper").first()).toBeVisible({ timeout: 5000 });
  });
});
