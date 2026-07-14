"use client";

import { type ReactElement, type Ref, useLayoutEffect, useRef, useState } from "react";
import { type YAxisTickContentProps } from "recharts";
import { type ChartConfig, ChartContainer } from "@repo/ui/components/chart";

const INITIAL_CHART_WIDTH = 320;
const BAR_SIZE = 36;
const BAR_GAP = 8;
const LABEL_FONT_SIZE = 12;
const LABEL_LINE_HEIGHT = 16;
const LABEL_AXIS_MIN_WIDTH = 96;
const LABEL_AXIS_MAX_WIDTH = 240;
const LABEL_AXIS_MAX_RATIO = 0.42;
const LABEL_TICK_GUTTER = 20;
const MIN_PLOT_WIDTH = 120;
const CHART_MARGIN_LEFT = 8;
const CHART_MARGIN_TOP = 8;
const CHART_MARGIN_BOTTOM = 8;
const DEFAULT_RIGHT_MARGIN = 8;
const DEFAULT_CHART_CHROME_HEIGHT = 48;
const LEGEND_PADDING_HEIGHT = 12;
const LEGEND_ROW_HEIGHT = 28;
const LEGEND_ITEMS_PER_ROW = 3;
const FALLBACK_CHARACTER_WIDTH = 6.5;

type MeasureText = (value: string) => number;

type HorizontalChartLayoutOptions = {
  labels: ReadonlyArray<string | number>;
  containerWidth: number;
  categoryAxisMaxRatio?: number;
  categoryAxisMaxWidth?: number;
  hideCategoryAxis?: boolean;
  rightMargin?: number;
  measureText?: MeasureText;
};

type HorizontalChartLayout = {
  axisWidth: number;
  barSize: number;
  categoryAxisPadding: {
    top: number;
    bottom: number;
  };
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  rowHeight: number;
  targetPlotHeight: number;
  wrappedLabels: string[][];
};

type HorizontalChartHeightOptions = {
  targetPlotHeight: number;
  legendItemCount?: number;
};

type AdaptiveHorizontalChartRenderProps = HorizontalChartLayout;

type AdaptiveHorizontalChartProps = {
  labels: ReadonlyArray<string | number>;
  chartConfig: ChartConfig;
  chartColors?: Partial<Record<string, string>>;
  chartRef?: Ref<HTMLDivElement>;
  categoryAxisMaxRatio?: number;
  categoryAxisMaxWidth?: number;
  exportFilename: string;
  hideCategoryAxis?: boolean;
  legendItemCount?: number;
  rightMargin?: number;
  children: (layout: AdaptiveHorizontalChartRenderProps) => ReactElement;
};

let textMeasurementContext: CanvasRenderingContext2D | null | undefined;
const graphemeSegmenter =
  typeof Intl.Segmenter === "function" ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function estimateTextWidth(value: string) {
  return splitGraphemes(value).length * FALLBACK_CHARACTER_WIDTH;
}

function splitGraphemes(value: string) {
  if (!graphemeSegmenter) {
    return Array.from(value);
  }

  return Array.from(graphemeSegmenter.segment(value), ({ segment }) => segment);
}

function measureChartText(value: string, font = `${LABEL_FONT_SIZE}px sans-serif`) {
  if (typeof document === "undefined" || typeof CanvasRenderingContext2D === "undefined") {
    return estimateTextWidth(value);
  }

  if (textMeasurementContext === undefined) {
    textMeasurementContext = document.createElement("canvas").getContext("2d");
  }

  if (!textMeasurementContext) {
    return estimateTextWidth(value);
  }

  textMeasurementContext.font = font;
  return textMeasurementContext.measureText(value).width;
}

function splitLongWord(word: string, maxWidth: number, measureText: MeasureText) {
  const parts: string[] = [];
  let part = "";

  for (const character of splitGraphemes(word)) {
    const candidate = `${part}${character}`;
    if (part && measureText(candidate) > maxWidth) {
      parts.push(part);
      part = character;
    } else {
      part = candidate;
    }
  }

  if (part) {
    parts.push(part);
  }

  return parts;
}

export function wrapHorizontalChartLabel(
  value: string,
  maxWidth: number,
  measureText: MeasureText = estimateTextWidth
) {
  const normalizedValue = value.trim().replace(/\s+/g, " ");
  if (!normalizedValue) {
    return [""];
  }

  const availableWidth = Math.max(1, maxWidth);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of normalizedValue.split(" ")) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (measureText(candidate) <= availableWidth) {
      currentLine = candidate;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
      currentLine = "";
    }

    if (measureText(word) <= availableWidth) {
      currentLine = word;
      continue;
    }

    const wordParts = splitLongWord(word, availableWidth, measureText);
    lines.push(...wordParts.slice(0, -1));
    currentLine = wordParts.at(-1) ?? "";
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [""];
}

export function calculateHorizontalChartLayout({
  labels,
  containerWidth,
  categoryAxisMaxRatio = LABEL_AXIS_MAX_RATIO,
  categoryAxisMaxWidth = LABEL_AXIS_MAX_WIDTH,
  hideCategoryAxis = false,
  rightMargin = DEFAULT_RIGHT_MARGIN,
  measureText = estimateTextWidth,
}: HorizontalChartLayoutOptions): HorizontalChartLayout {
  const availableWidth = Math.max(0, containerWidth - CHART_MARGIN_LEFT - rightMargin);
  const widthWithReservedPlot =
    availableWidth >= MIN_PLOT_WIDTH ? availableWidth - MIN_PLOT_WIDTH : availableWidth * categoryAxisMaxRatio;
  const maximumAxisWidth = Math.min(
    availableWidth,
    categoryAxisMaxWidth,
    containerWidth * categoryAxisMaxRatio,
    widthWithReservedPlot
  );
  const minimumAxisWidth = Math.min(LABEL_AXIS_MIN_WIDTH, maximumAxisWidth);
  let longestLabelWidth = 0;
  for (const label of labels) {
    longestLabelWidth = Math.max(longestLabelWidth, measureText(String(label)));
  }
  const axisWidth = hideCategoryAxis
    ? 0
    : Math.round(clamp(longestLabelWidth + LABEL_TICK_GUTTER, minimumAxisWidth, maximumAxisWidth));
  const labelWidth = Math.max(1, axisWidth - LABEL_TICK_GUTTER);
  const wrappedLabels = labels.map((label) =>
    hideCategoryAxis ? [String(label)] : wrapHorizontalChartLabel(String(label), labelWidth, measureText)
  );
  const maximumLineCount = hideCategoryAxis
    ? 1
    : Math.max(1, ...wrappedLabels.map((wrappedLabel) => wrappedLabel.length));
  const labelHeight = hideCategoryAxis ? 0 : maximumLineCount * LABEL_LINE_HEIGHT;
  const barSize = BAR_SIZE;
  const rowHeight = Math.max(labelHeight + BAR_GAP, barSize + BAR_GAP);
  const targetPlotHeight = Math.max(1, labels.length) * rowHeight + BAR_GAP;

  return {
    axisWidth,
    barSize,
    categoryAxisPadding: {
      top: BAR_GAP / 2,
      bottom: BAR_GAP / 2,
    },
    margin: {
      top: CHART_MARGIN_TOP,
      right: rightMargin,
      bottom: CHART_MARGIN_BOTTOM,
      left: CHART_MARGIN_LEFT,
    },
    rowHeight,
    targetPlotHeight,
    wrappedLabels,
  };
}

export function calculateHorizontalChartHeight({
  targetPlotHeight,
  legendItemCount = 0,
}: HorizontalChartHeightOptions) {
  const legendHeight =
    legendItemCount > 0
      ? LEGEND_PADDING_HEIGHT + Math.ceil(legendItemCount / LEGEND_ITEMS_PER_ROW) * LEGEND_ROW_HEIGHT
      : 0;
  const contentHeight = Math.ceil(targetPlotHeight + DEFAULT_CHART_CHROME_HEIGHT + legendHeight);

  return contentHeight;
}

export function HorizontalCategoryTick({
  lines,
  x,
  y,
  payload,
}: Pick<YAxisTickContentProps, "x" | "y" | "payload"> & { lines: ReadonlyArray<string> }) {
  const tickX = Number(x);
  const tickY = Number(y);
  if (!Number.isFinite(tickX) || !Number.isFinite(tickY)) {
    return null;
  }

  const resolvedLines = lines.length > 0 ? lines : [String(payload.value ?? "")];
  const firstLineOffset = -((resolvedLines.length - 1) * LABEL_LINE_HEIGHT) / 2;

  return (
    <text
      x={tickX}
      y={tickY}
      aria-label={String(payload.value ?? "")}
      className="fill-muted-foreground"
      dominantBaseline="middle"
      fontSize={LABEL_FONT_SIZE}
      textAnchor="end">
      {resolvedLines.map((line, index) => (
        <tspan key={`${index}-${line}`} x={tickX} dy={index === 0 ? firstLineOffset : LABEL_LINE_HEIGHT}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

export function AdaptiveHorizontalChart({
  labels,
  chartConfig,
  chartColors,
  chartRef,
  categoryAxisMaxRatio,
  categoryAxisMaxWidth,
  exportFilename,
  hideCategoryAxis = false,
  legendItemCount = 0,
  rightMargin = DEFAULT_RIGHT_MARGIN,
  children,
}: AdaptiveHorizontalChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(INITIAL_CHART_WIDTH);
  const [measurementFont, setMeasurementFont] = useState<string | null>(null);
  const measureText = measurementFont ? (value: string) => measureChartText(value, measurementFont) : estimateTextWidth;
  const layout = calculateHorizontalChartLayout({
    labels,
    containerWidth,
    categoryAxisMaxRatio,
    categoryAxisMaxWidth,
    hideCategoryAxis,
    rightMargin,
    measureText,
  });
  const chartHeight = calculateHorizontalChartHeight({
    targetPlotHeight: layout.targetPlotHeight,
    legendItemCount,
  });

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const updateWidth = (width: number) => {
      if (width > 0) {
        setContainerWidth((currentWidth) => (Math.abs(currentWidth - width) < 1 ? currentWidth : width));
      }
    };

    updateWidth(container.getBoundingClientRect().width);
    const computedStyle = getComputedStyle(container);
    const resolvedFont = `${computedStyle.fontStyle} ${computedStyle.fontWeight} ${LABEL_FONT_SIZE}px ${computedStyle.fontFamily}`;
    setMeasurementFont((currentFont) => (currentFont === resolvedFont ? currentFont : resolvedFont));
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        updateWidth(entry.contentRect.width);
      }
    });
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full" style={{ height: chartHeight }}>
      <ChartContainer
        config={chartConfig}
        chartColors={chartColors}
        ref={chartRef}
        data-export-filename={exportFilename}
        data-chart-axis-width={layout.axisWidth}
        data-chart-bar-size={layout.barSize}
        data-chart-height={chartHeight}
        data-chart-row-height={layout.rowHeight}
        className="aspect-auto h-full"
        initialDimension={{ width: containerWidth, height: chartHeight }}>
        {children(layout)}
      </ChartContainer>
    </div>
  );
}
