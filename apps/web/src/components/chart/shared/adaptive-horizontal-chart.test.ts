import { describe, expect, test } from "vitest";
import {
  calculateHorizontalChartHeight,
  calculateHorizontalChartLayout,
  wrapHorizontalChartLabel,
} from "./adaptive-horizontal-chart";

const measureText = (value: string) => value.length * 6;

const matrixLabels = [
  "Frühzeitiger Zugang zum Sale",
  "Vorteilsaktionen",
  "Entfall der Versandkosten",
  "Verlängertes Rückgaberecht",
  "Frühzeitiger Zugang zu neuen Kollektionen",
  "Premium-Kundenservice",
  "Produkttests",
  "Produktproben",
  "Zugang zum Online Outlet",
  "Exklusive Events",
  "Geschenkverpackung",
  "Geburtstagsüberraschung",
];

describe("adaptive horizontal chart layout", () => {
  test("wraps the reported label without losing text", () => {
    const label = "Frühzeitiger Zugang zu neuen Kollektionen";
    const lines = wrapHorizontalChartLabel(label, 120, measureText);

    expect(lines).toEqual(["Frühzeitiger Zugang", "zu neuen", "Kollektionen"]);
    expect(lines.join(" ")).toBe(label);
    expect(lines.every((line) => measureText(line) <= 120)).toBe(true);
  });

  test("breaks a word that is wider than the label column", () => {
    const label = "Geburtstagsüberraschung";
    const lines = wrapHorizontalChartLabel(label, 42, measureText);

    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join("")).toBe(label);
    expect(lines.every((line) => measureText(line) <= 42)).toBe(true);
  });

  test("grows a twelve-row matrix chart for two-line labels", () => {
    const layout = calculateHorizontalChartLayout({
      labels: matrixLabels,
      containerWidth: 848,
      measureText,
    });

    expect(layout.axisWidth).toBe(240);
    expect(layout.wrappedLabels[4]).toHaveLength(2);
    expect(layout.barSize).toBe(36);
    expect(layout.rowHeight).toBe(44);
    expect(layout.categoryAxisPadding).toEqual({ top: 4, bottom: 4 });
    expect(layout.targetPlotHeight).toBe(536);
  });

  test("allocates more row height when a narrow chart wraps onto more lines", () => {
    const labels = ["Frühzeitiger Zugang zu neuen Kollektionen"];
    const wideLayout = calculateHorizontalChartLayout({ labels, containerWidth: 848, measureText, rightMargin: 48 });
    const narrowLayout = calculateHorizontalChartLayout({ labels, containerWidth: 295, measureText, rightMargin: 48 });

    expect(narrowLayout.wrappedLabels[0]?.length).toBeGreaterThan(wideLayout.wrappedLabels[0]?.length ?? 0);
    expect(narrowLayout.rowHeight).toBeGreaterThan(wideLayout.rowHeight);
    expect(narrowLayout.barSize).toBeLessThanOrEqual(36);
  });

  test("shrinks the label axis before consuming the minimum plot width", () => {
    const layout = calculateHorizontalChartLayout({
      labels: ["Frühzeitiger Zugang zu neuen Kollektionen"],
      containerWidth: 240,
      measureText,
      rightMargin: 48,
    });

    expect(layout.axisWidth).toBe(64);
    expect(240 - layout.margin.left - layout.margin.right - layout.axisWidth).toBeGreaterThanOrEqual(120);
  });

  test("allows multi-response charts to widen the category axis for long labels", () => {
    const label = "aaaaaaaaaaaa bbbbbbbbbbbb cccccccccccc dddddddddddd eeeeeeeeeeee";
    const defaultLayout = calculateHorizontalChartLayout({
      labels: [label],
      containerWidth: 552,
      measureText,
      rightMargin: 48,
    });
    const wideLayout = calculateHorizontalChartLayout({
      labels: [label],
      containerWidth: 552,
      categoryAxisMaxRatio: 0.48,
      categoryAxisMaxWidth: 260,
      measureText,
      rightMargin: 48,
    });

    expect(defaultLayout.axisWidth).toBe(232);
    expect(defaultLayout.wrappedLabels[0]).toHaveLength(3);
    expect(wideLayout.axisWidth).toBe(260);
    expect(wideLayout.wrappedLabels[0]).toHaveLength(2);
    expect(wideLayout.rowHeight - wideLayout.barSize).toBe(8);
  });

  test("uses the constant bar size for a single row when category labels are hidden", () => {
    const layout = calculateHorizontalChartLayout({
      labels: [""],
      containerWidth: 320,
      hideCategoryAxis: true,
      measureText,
    });

    expect(layout.axisWidth).toBe(0);
    expect(layout.barSize).toBe(36);
    expect(layout.rowHeight).toBe(44);
    expect(layout.categoryAxisPadding).toEqual({ top: 4, bottom: 4 });
    expect(layout.targetPlotHeight).toBe(52);
    expect(calculateHorizontalChartHeight({ targetPlotHeight: layout.targetPlotHeight })).toBe(100);
  });

  test("uses the target gap and row-derived height for multiple one-line rows", () => {
    const layout = calculateHorizontalChartLayout({
      labels: ["First", "Second"],
      containerWidth: 320,
      measureText,
    });

    expect(layout.barSize).toBe(36);
    expect(layout.rowHeight).toBe(44);
    expect(layout.rowHeight - layout.barSize).toBe(8);
    expect(layout.categoryAxisPadding).toEqual({ top: 4, bottom: 4 });
    expect(layout.targetPlotHeight).toBe(96);
    expect(calculateHorizontalChartHeight({ targetPlotHeight: layout.targetPlotHeight })).toBe(144);
  });

  test.each([
    [2, 144],
    [3, 188],
    [4, 232],
    [5, 276],
    [6, 320],
  ])("derives the chart height for %i one-line rows", (rowCount, expectedHeight) => {
    expect(calculateHorizontalChartHeight({ targetPlotHeight: rowCount * 44 + 8 })).toBe(expectedHeight);
  });

  test("keeps the same target gap across reported three-row and five-row layouts", () => {
    const wrappedLabel = "First wrapped category";
    const threeRowLayout = calculateHorizontalChartLayout({
      labels: [wrappedLabel, "Second", "Third"],
      containerWidth: 320,
      measureText,
    });
    const fiveRowLayout = calculateHorizontalChartLayout({
      labels: [wrappedLabel, "Second", "Third", "Fourth", "Fifth"],
      containerWidth: 320,
      measureText,
    });

    expect(threeRowLayout.wrappedLabels[0]).toHaveLength(2);
    expect(threeRowLayout.barSize).toBe(36);
    expect(threeRowLayout.rowHeight).toBe(44);
    expect(threeRowLayout.rowHeight - threeRowLayout.barSize).toBe(8);
    expect(fiveRowLayout.rowHeight).toBe(threeRowLayout.rowHeight);
    expect(fiveRowLayout.barSize).toBe(threeRowLayout.barSize);
    expect(calculateHorizontalChartHeight({ targetPlotHeight: threeRowLayout.targetPlotHeight })).toBe(188);
    expect(calculateHorizontalChartHeight({ targetPlotHeight: fiveRowLayout.targetPlotHeight })).toBe(276);
  });

  test("allows legends to grow a compact single-row chart", () => {
    expect(calculateHorizontalChartHeight({ targetPlotHeight: 52, legendItemCount: 3 })).toBe(140);
    expect(calculateHorizontalChartHeight({ targetPlotHeight: 52, legendItemCount: 6 })).toBe(168);
  });
});
