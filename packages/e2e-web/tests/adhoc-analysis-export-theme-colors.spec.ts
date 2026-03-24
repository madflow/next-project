import { type Page, expect, test } from "@playwright/test";
import { loginAs } from "../utils";

const DATASET_NAME = "SPSS Beispielumfrage";
const GROUP_NAME = "Bildung und Beruf";
const THEME_NAME = "Blue";
const VARIABLE_TEST_ID = "variable-item-degree";
const EXCEL_EXPORT_ROUTE = "**/api/datasets/*/exports/excel";
const POWERPOINT_EXPORT_ROUTE = "**/api/datasets/*/exports/powerpoint";

type DistributionExportPayload = {
  file_name: string;
  palette: string[];
  chart: {
    kind: string;
    points: Array<{
      color: string;
      label: string;
      value: number;
    }>;
  };
};

function colorChannelToHex(channel: number) {
  return channel.toString(16).padStart(2, "0");
}

async function selectDegreeVariable(page: Page) {
  await page.goto("/project/test-project/adhoc");
  await expect(page.getByTestId("app.project.adhoc")).toBeVisible();

  await page.getByTestId("app.dropdown.dataset.trigger").click();
  await page.getByText(DATASET_NAME).click();
  await expect(page.getByTestId("app.dropdown.dataset.trigger")).toContainText(DATASET_NAME);

  const expandButton = page.getByTestId(`variable-group-expand-${GROUP_NAME}`);
  await expect(expandButton).toBeVisible();
  await expandButton.click();

  const degreeVariable = page.getByTestId(VARIABLE_TEST_ID);
  await expect(degreeVariable).toBeVisible();
  await degreeVariable.click();

  await expect(page.getByTestId("chart-type-selector")).toBeVisible();
  await page.getByTestId("chart-type-horizontalBar").click();
  await expect(page.getByTestId("chart-content-horizontalBar")).toBeVisible();
}

async function selectTheme(page: Page, themeName: string) {
  await page.getByRole("combobox", { name: "Change theme" }).click();
  await page.getByRole("option", { name: themeName }).click();
  await expect.poll(() => page.evaluate(() => document.body.className)).toContain(`theme-${themeName.toLowerCase()}`);
}

async function readThemePalette(page: Page) {
  return page.evaluate(() => {
    const themeContainer = document.querySelector(".theme-container");
    if (!(themeContainer instanceof HTMLElement)) {
      throw new Error("Theme container not found");
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext("2d", { willReadFrequently: true }) ?? canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas 2D context unavailable");
    }

    const toHex = (color: string) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      const data = context.getImageData(0, 0, 1, 1).data;
      const red = data[0] ?? 0;
      const green = data[1] ?? 0;
      const blue = data[2] ?? 0;
      return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
    };

    return Array.from({ length: 6 }, (_, index) => {
      const probe = document.createElement("span");
      probe.style.color = `var(--chart-${index + 1})`;
      probe.style.position = "absolute";
      probe.style.visibility = "hidden";
      probe.style.pointerEvents = "none";
      themeContainer.appendChild(probe);

      try {
        return toHex(getComputedStyle(probe).color);
      } finally {
        probe.remove();
      }
    });
  });
}

async function readRenderedBarColor(page: Page) {
  const firstBar = page.getByTestId("chart-content-horizontalBar").locator("svg .recharts-rectangle").first();
  await expect(firstBar).toBeVisible();

  return firstBar.evaluate((element) => {
    const svgElement = element as SVGElement;
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext("2d", { willReadFrequently: true }) ?? canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas 2D context unavailable");
    }

    context.clearRect(0, 0, 1, 1);
    context.fillStyle = getComputedStyle(svgElement).fill;
    context.fillRect(0, 0, 1, 1);

    const data = context.getImageData(0, 0, 1, 1).data;
    const red = data[0] ?? 0;
    const green = data[1] ?? 0;
    const blue = data[2] ?? 0;

    return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
  });
}

async function captureExportPayload(page: Page, routePattern: string, menuItemName: string) {
  let capturedPayload: DistributionExportPayload | null = null;
  const isExcelExport = routePattern === EXCEL_EXPORT_ROUTE;

  await page.route(routePattern, async (route) => {
    capturedPayload = JSON.parse(route.request().postData() ?? "{}") as DistributionExportPayload;
    await route.fulfill({
      status: 200,
      body: "stub",
      headers: {
        "Content-Type": isExcelExport
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": isExcelExport ? 'attachment; filename="stub.xlsx"' : 'attachment; filename="stub.pptx"',
      },
    });
  });

  await page.getByRole("button", { name: "Export chart" }).click();
  await page.getByRole("menuitem", { name: menuItemName }).click();

  await expect.poll(() => capturedPayload).not.toBeNull();
  await page.unroute(routePattern);

  return capturedPayload as DistributionExportPayload;
}

function expectDistributionColorsToMatchTheme(
  payload: DistributionExportPayload,
  expectedPalette: string[],
  expectedBarColor: string
) {
  expect(payload.palette).toEqual(expectedPalette);
  expect(payload.chart.kind).toBe("horizontalBar");
  expect(payload.chart.points.length).toBeGreaterThan(0);
  expect(payload.chart.points.map((point) => point.color)).toEqual(
    Array.from({ length: payload.chart.points.length }, () => expectedBarColor)
  );
}

test.describe("Adhoc Analysis - Export Theme Colors", () => {
  test("should export the live themed horizontal bar colors to Excel and PowerPoint", async ({ page }) => {
    await loginAs(page, "admin");
    await selectDegreeVariable(page);
    await selectTheme(page, THEME_NAME);

    const expectedPalette = await readThemePalette(page);
    const expectedBarColor = await readRenderedBarColor(page);

    expect(expectedPalette[0]).toBe(expectedBarColor);
    expect(colorChannelToHex(Number.parseInt(expectedBarColor.slice(1, 3), 16))).toBe(expectedBarColor.slice(1, 3));

    const excelPayload = await captureExportPayload(page, EXCEL_EXPORT_ROUTE, "Export as Excel");
    expect(excelPayload.file_name).toMatch(/^degree-\d{4}-\d{2}-\d{2}\.xlsx$/);
    expectDistributionColorsToMatchTheme(excelPayload, expectedPalette, expectedBarColor);

    const powerpointPayload = await captureExportPayload(page, POWERPOINT_EXPORT_ROUTE, "Export as PowerPoint");
    expect(powerpointPayload.file_name).toMatch(/^degree-\d{4}-\d{2}-\d{2}\.pptx$/);
    expectDistributionColorsToMatchTheme(powerpointPayload, expectedPalette, expectedBarColor);
  });
});
