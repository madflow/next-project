import {
  createSingleHorizontalStackedBarModel,
  createSplitHorizontalStackedBarModel,
} from "@/components/chart/horizontal-stacked-bar-model";
import {
  extractVariableStats,
  hasSplitVariableStatsForVariable,
  transformToMultiResponseData,
  transformToMultiResponseIndividualBarData,
  transformToMultiResponseIndividualStackedBarData,
  transformToRechartsBarData,
  transformToRechartsPieData,
  transformToRechartsStackedBarData,
  transformToSplitVariableStackedBarData,
} from "@/lib/analysis-bridge";
import { METRICS_CARD_DECIMALS, formatChartValue } from "@/lib/chart-constants";
import { getVariableLabel } from "@/lib/variable-helpers";
import { type DatasetVariableWithAttributes } from "@/types/dataset-variable";
import { type ThemeItem } from "@/types/organization";
import { type AnalysisChartType, type StatsResponse } from "@/types/stats";

const EXPORT_PALETTE_KEYS = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5", "chart-6"] as const;

const DEFAULT_EXPORT_PALETTE = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"] as const;

const RGB_COLOR_PATTERN =
  /^rgba?\(\s*([0-9.]+%?)(?:\s*,\s*|\s+)([0-9.]+%?)(?:\s*,\s*|\s+)([0-9.]+%?)(?:\s*(?:,\s*|\/\s*|\s+)([0-9.]+%?))?\s*\)$/i;

type PaletteDomAdapter = {
  createProbe: () => HTMLElement;
  getComputedColor: (probe: HTMLElement) => string;
  resolveScope: (scopeElement: HTMLElement | null) => HTMLElement | null;
  colorToHex?: (color: string) => string | null;
};

type ExportPoint = {
  label: string;
  value: number;
  color: string;
};

type ExportStackedSegment = {
  label: string;
  value: number;
  color: string;
};

type ExportStackedRow = {
  label: string;
  segments: ExportStackedSegment[];
};

type ExportMetric = {
  label: string;
  value: string;
};

type DistributionChartSpec = {
  kind: "bar" | "horizontalBar" | "multiResponse";
  points: ExportPoint[];
};

type HorizontalStackedBarChartSpec = {
  kind: "horizontalStackedBar";
  rows: ExportStackedRow[];
};

type PieChartSpec = {
  kind: "pie";
  points: ExportPoint[];
};

type MeanBarChartSpec = {
  kind: "meanBar";
  points: Array<{ label: string; value: number }>;
  min_value: number;
  max_value: number;
  color: string;
};

type MetricsChartSpec = {
  kind: "metrics";
  metrics: ExportMetric[];
};

type AdhocPowerPointChartSpec =
  | DistributionChartSpec
  | HorizontalStackedBarChartSpec
  | PieChartSpec
  | MeanBarChartSpec
  | MetricsChartSpec;

type AdhocExcelChartSpec = AdhocPowerPointChartSpec;

type AdhocPowerPointExportPayload = {
  file_name: string;
  title: string;
  meta_line: string;
  palette: string[];
  chart: AdhocPowerPointChartSpec;
};

type AdhocExcelExportPayload = {
  file_name: string;
  title: string;
  meta_line: string;
  labels: {
    label: string;
    value: string;
    value_percent: string;
    color: string;
    metric: string;
  };
  palette: string[];
  chart: AdhocExcelChartSpec;
};

type ExcelExportLabels = {
  label: string;
  value: string;
  valuePercent: string;
  color: string;
  metric: string;
};

type MetricLabels = {
  count: string;
  max: string;
  mean: string;
  median: string;
  min: string;
  stdev: string;
};

type VariableChartExportOptions = {
  chartType: Exclude<AnalysisChartType, "textExplorer">;
  countedValue?: number;
  fileBaseName?: string;
  isMultiResponseIndividual?: boolean;
  metaLine: string;
  metricsLabels: MetricLabels;
  palette: string[];
  stats: StatsResponse;
  variable: DatasetVariableWithAttributes;
};

type VariableChartExcelExportOptions = VariableChartExportOptions & {
  excelLabels: ExcelExportLabels;
};

type MultiResponseChartExportOptions = {
  countedValue?: number;
  fileBaseName?: string;
  metaLine: string;
  palette: string[];
  statsData: Record<string, StatsResponse>;
  title: string;
  variables: DatasetVariableWithAttributes[];
};

type MultiResponseExcelChartExportOptions = MultiResponseChartExportOptions & {
  excelLabels: ExcelExportLabels;
};

function serializeExcelLabels(labels: ExcelExportLabels) {
  return {
    label: labels.label,
    value: labels.value,
    value_percent: labels.valuePercent,
    color: labels.color,
    metric: labels.metric,
  };
}

function roundExportValue(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizeHexColor(color: string) {
  const normalized = color.trim();

  if (/^#[0-9a-f]{6}$/i.test(normalized)) {
    return normalized.toLowerCase();
  }

  if (/^#[0-9a-f]{3}$/i.test(normalized)) {
    const [red, green, blue] = normalized.slice(1).split("");
    return `#${red}${red}${green}${green}${blue}${blue}`.toLowerCase();
  }

  return null;
}

function clampRgbChannel(value: number) {
  return Math.max(0, Math.min(255, value));
}

function parseRgbChannel(channel: string) {
  const numericValue = Number.parseFloat(channel);

  if (Number.isNaN(numericValue)) {
    return null;
  }

  if (channel.endsWith("%")) {
    return clampRgbChannel(Math.round((numericValue / 100) * 255));
  }

  return clampRgbChannel(Math.round(numericValue));
}

function channelToHex(channel: number) {
  return channel.toString(16).padStart(2, "0");
}

function rgbChannelsToHex(red: number, green: number, blue: number) {
  return `#${channelToHex(red)}${channelToHex(green)}${channelToHex(blue)}`;
}

function cssColorToHex(color: string) {
  const normalizedHexColor = normalizeHexColor(color);
  if (normalizedHexColor) {
    return normalizedHexColor;
  }

  const match = RGB_COLOR_PATTERN.exec(color.trim());
  if (!match) {
    return null;
  }

  const [, redChannel, greenChannel, blueChannel] = match;
  if (!redChannel || !greenChannel || !blueChannel) {
    return null;
  }

  const red = parseRgbChannel(redChannel);
  const green = parseRgbChannel(greenChannel);
  const blue = parseRgbChannel(blueChannel);

  if (red === null || green === null || blue === null) {
    return null;
  }

  return rgbChannelsToHex(red, green, blue);
}

function createPaletteDomAdapter(): PaletteDomAdapter | null {
  if (typeof document === "undefined" || typeof getComputedStyle === "undefined") {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true }) ?? canvas.getContext("2d");
  const sentinelColor = "#010203";

  return {
    createProbe: () => document.createElement("span"),
    getComputedColor: (probe) => getComputedStyle(probe).color,
    resolveScope: (scopeElement) =>
      (scopeElement?.matches("[data-slot='chart']") ? scopeElement : scopeElement?.closest<HTMLElement>("[data-slot='chart']")) ??
      scopeElement?.querySelector<HTMLElement>("[data-slot='chart']") ??
      scopeElement?.closest<HTMLElement>(".theme-container") ??
      document.querySelector<HTMLElement>(".theme-container"),
    colorToHex: (color) => {
      const normalizedHexColor = cssColorToHex(color);
      if (normalizedHexColor) {
        return normalizedHexColor;
      }

      if (!context) {
        return null;
      }

      context.clearRect(0, 0, 1, 1);
      context.fillStyle = sentinelColor;
      const beforeFillStyle = context.fillStyle.toLowerCase();

      try {
        context.fillStyle = color;
      } catch {
        return null;
      }

      const normalizedInput = color.trim().toLowerCase();
      const afterFillStyle = context.fillStyle.toLowerCase();
      if (
        afterFillStyle === beforeFillStyle &&
        normalizedInput !== beforeFillStyle &&
        normalizedInput !== sentinelColor
      ) {
        return null;
      }

      context.fillRect(0, 0, 1, 1);
      const data = context.getImageData(0, 0, 1, 1).data;
      const red = data[0] ?? 0;
      const green = data[1] ?? 0;
      const blue = data[2] ?? 0;

      return rgbChannelsToHex(red, green, blue);
    },
  };
}

function formatMetricValue(value?: number, decimals?: number) {
  if (value === null || value === undefined) {
    return "";
  }

  if (decimals === undefined) {
    return String(value);
  }

  return formatChartValue(value, decimals);
}

function mapDistributionPoints(
  points: Array<{ label: string | number; percentage: number }>,
  palette: string[],
  uniformColor: boolean = true
) {
  return points.map((point, index) => ({
    label: String(point.label),
    value: roundExportValue(point.percentage),
    color: uniformColor
      ? (palette[0] ?? DEFAULT_EXPORT_PALETTE[0])
      : (palette[index] ?? DEFAULT_EXPORT_PALETTE[index % DEFAULT_EXPORT_PALETTE.length]!),
  }));
}

export function getExportPalette(chartColors?: ThemeItem["chartColors"] | null) {
  return EXPORT_PALETTE_KEYS.map((key, index) => chartColors?.[key] ?? DEFAULT_EXPORT_PALETTE[index]!);
}

export function getComputedExportPalette(
  scopeElement: HTMLElement | null,
  fallbackChartColors?: ThemeItem["chartColors"] | null,
  domAdapter: PaletteDomAdapter | null = createPaletteDomAdapter()
) {
  if (!domAdapter) {
    return getExportPalette(fallbackChartColors);
  }

  const scope = domAdapter.resolveScope(scopeElement);
  if (!scope) {
    return getExportPalette(fallbackChartColors);
  }

  const palette = EXPORT_PALETTE_KEYS.map((key) => {
    const probe = domAdapter.createProbe();
    probe.style.color = `var(--${key})`;
    probe.style.position = "absolute";
    probe.style.visibility = "hidden";
    probe.style.pointerEvents = "none";
    scope.appendChild(probe);

    try {
      const color = domAdapter.getComputedColor(probe);
      return domAdapter.colorToHex?.(color) ?? cssColorToHex(color);
    } finally {
      probe.remove();
    }
  });

  return palette.every((color): color is string => color !== null) ? palette : getExportPalette(fallbackChartColors);
}

export function buildExportMetaLine({
  datasetName,
  exportedAtLabel,
  labels,
  splitLabel,
}: {
  datasetName: string;
  exportedAtLabel: string;
  labels: {
    dataset: string;
    exported: string;
    split: string;
  };
  splitLabel?: string | null;
}) {
  const parts = [`${labels.dataset}: ${datasetName}`];

  if (splitLabel) {
    parts.push(`${labels.split}: ${splitLabel}`);
  }

  parts.push(`${labels.exported}: ${exportedAtLabel}`);

  return parts.join(" | ");
}

export function sanitizeExportBaseName(value: string) {
  const normalized = value
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .toLowerCase();

  return normalized.length > 0 ? normalized : "chart";
}

export function buildImageFileName(value: string) {
  return `${sanitizeExportBaseName(value)}.png`;
}

export function buildPowerPointFileName(value: string, date: Date = new Date()) {
  const exportDate = date.toISOString().split("T")[0] ?? "export";
  return `${sanitizeExportBaseName(value)}-${exportDate}.pptx`;
}

export function buildExcelFileName(value: string, date: Date = new Date()) {
  const exportDate = date.toISOString().split("T")[0] ?? "export";
  return `${sanitizeExportBaseName(value)}-${exportDate}.xlsx`;
}

export function getDownloadFilename(response: Response, fallbackFilename: string) {
  const contentDisposition = response.headers.get("Content-Disposition");
  const filenameMatch = contentDisposition?.match(/filename="?([^";]+)"?/i);
  return filenameMatch?.[1] ?? fallbackFilename;
}

export async function downloadResponseFile(response: Response, fallbackFilename: string) {
  const filename = getDownloadFilename(response, fallbackFilename);
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}

export async function exportPowerPointForDataset(datasetId: string, payload: AdhocPowerPointExportPayload) {
  const response = await fetch(`/api/datasets/${datasetId}/exports/powerpoint`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = `PowerPoint export failed with status ${response.status}`;

    try {
      const errorPayload = (await response.json()) as { detail?: string; error?: string };
      if (errorPayload.error) {
        message = errorPayload.error;
      } else if (errorPayload.detail) {
        message = errorPayload.detail;
      }
    } catch {
      // Ignore JSON parsing failures and keep fallback error message.
    }

    throw new Error(message);
  }

  await downloadResponseFile(response, payload.file_name);
}

export async function exportExcelForDataset(datasetId: string, payload: AdhocExcelExportPayload) {
  const response = await fetch(`/api/datasets/${datasetId}/exports/excel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = `Excel export failed with status ${response.status}`;

    try {
      const errorPayload = (await response.json()) as { detail?: string; error?: string };
      if (errorPayload.error) {
        message = errorPayload.error;
      } else if (errorPayload.detail) {
        message = errorPayload.detail;
      }
    } catch {
      // Ignore JSON parsing failures and keep fallback error message.
    }

    throw new Error(message);
  }

  await downloadResponseFile(response, payload.file_name);
}

export function createVariableChartExcelExportPayload({
  chartType,
  countedValue = 1,
  excelLabels,
  fileBaseName,
  isMultiResponseIndividual = false,
  metaLine,
  metricsLabels,
  palette,
  stats,
  variable,
}: VariableChartExcelExportOptions): AdhocExcelExportPayload {
  const powerpointPayload = createVariableChartPowerPointExportPayload({
    chartType,
    countedValue,
    fileBaseName,
    isMultiResponseIndividual,
    metaLine,
    metricsLabels,
    palette,
    stats,
    variable,
  });

  return {
    ...powerpointPayload,
    labels: serializeExcelLabels(excelLabels),
    file_name: buildExcelFileName(fileBaseName ?? variable.name),
  };
}

export function createMultiResponseExcelExportPayload({
  countedValue = 1,
  excelLabels,
  fileBaseName,
  metaLine,
  palette,
  statsData,
  title,
  variables,
}: MultiResponseExcelChartExportOptions): AdhocExcelExportPayload {
  const powerpointPayload = createMultiResponsePowerPointExportPayload({
    countedValue,
    fileBaseName,
    metaLine,
    palette,
    statsData,
    title,
    variables,
  });

  return {
    ...powerpointPayload,
    labels: serializeExcelLabels(excelLabels),
    file_name: buildExcelFileName(fileBaseName ?? `${title}-multi-response`),
  };
}

export function createVariableChartPowerPointExportPayload({
  chartType,
  countedValue = 1,
  fileBaseName,
  isMultiResponseIndividual = false,
  metaLine,
  metricsLabels,
  palette,
  stats,
  variable,
}: VariableChartExportOptions): AdhocPowerPointExportPayload {
  const title = getVariableLabel(variable);
  const file_name = buildPowerPointFileName(fileBaseName ?? variable.name);

  switch (chartType) {
    case "bar": {
      return {
        file_name,
        title,
        meta_line: metaLine,
        palette,
        chart: {
          kind: "bar",
          points: mapDistributionPoints(transformToRechartsBarData(variable, stats), palette, true),
        },
      };
    }
    case "horizontalBar": {
      const points = isMultiResponseIndividual
        ? transformToMultiResponseIndividualBarData(variable, stats, countedValue)
        : transformToRechartsBarData(variable, stats);

      return {
        file_name,
        title,
        meta_line: metaLine,
        palette,
        chart: {
          kind: "horizontalBar",
          points: mapDistributionPoints(points, palette, true),
        },
      };
    }
    case "horizontalStackedBar": {
      const model = hasSplitVariableStatsForVariable(stats, variable.name)
        ? createSplitHorizontalStackedBarModel(
            isMultiResponseIndividual
              ? transformToMultiResponseIndividualStackedBarData(variable, stats, countedValue)
              : transformToSplitVariableStackedBarData(variable, stats),
            !isMultiResponseIndividual
          )
        : createSingleHorizontalStackedBarModel(
            getVariableLabel(variable),
            transformToRechartsStackedBarData(variable, stats)
          );

      return {
        file_name,
        title,
        meta_line: metaLine,
        palette,
        chart: {
          kind: "horizontalStackedBar",
          rows: model.chartData.map((row) => ({
            label: String(row.label),
            segments: model.segments.map((segment, index) => ({
              label: segment.label,
              value: roundExportValue(Number(row[segment.key] ?? 0)),
              color: palette[index] ?? DEFAULT_EXPORT_PALETTE[index % DEFAULT_EXPORT_PALETTE.length]!,
            })),
          })),
        },
      };
    }
    case "pie": {
      return {
        file_name,
        title,
        meta_line: metaLine,
        palette,
        chart: {
          kind: "pie",
          points: transformToRechartsPieData(variable, stats).map((point, index) => ({
            label: String(point.label),
            value: roundExportValue(point.percentage),
            color: palette[index] ?? DEFAULT_EXPORT_PALETTE[index % DEFAULT_EXPORT_PALETTE.length]!,
          })),
        },
      };
    }
    case "meanBar": {
      const variableStats = extractVariableStats(variable, stats);

      if (!variableStats) {
        throw new Error(`Unable to build mean bar export for variable '${variable.name}'`);
      }

      return {
        file_name,
        title,
        meta_line: metaLine,
        palette,
        chart: {
          kind: "meanBar",
          points: [
            { label: metricsLabels.mean, value: roundExportValue(variableStats.mean) },
            { label: metricsLabels.median, value: roundExportValue(variableStats.median) },
          ],
          min_value: variable.attributes?.valueRange?.min ?? variableStats.min,
          max_value: variable.attributes?.valueRange?.max ?? variableStats.max,
          color: palette[0] ?? DEFAULT_EXPORT_PALETTE[0],
        },
      };
    }
    case "metrics": {
      const variableStats = extractVariableStats(variable, stats);

      if (!variableStats) {
        throw new Error(`Unable to build metrics export for variable '${variable.name}'`);
      }

      return {
        file_name,
        title,
        meta_line: metaLine,
        palette,
        chart: {
          kind: "metrics",
          metrics: [
            { label: metricsLabels.count, value: formatMetricValue(variableStats.count) },
            { label: metricsLabels.mean, value: formatMetricValue(variableStats.mean, METRICS_CARD_DECIMALS) },
            { label: metricsLabels.stdev, value: formatMetricValue(variableStats.std, METRICS_CARD_DECIMALS) },
            { label: metricsLabels.median, value: formatMetricValue(variableStats.median) },
            { label: metricsLabels.min, value: formatMetricValue(variableStats.min) },
            { label: metricsLabels.max, value: formatMetricValue(variableStats.max) },
          ],
        },
      };
    }
    default: {
      const unreachableChartType: never = chartType;
      throw new Error(`Unsupported export chart type '${unreachableChartType}'`);
    }
  }
}

export function createMultiResponsePowerPointExportPayload({
  countedValue = 1,
  fileBaseName,
  metaLine,
  palette,
  statsData,
  title,
  variables,
}: MultiResponseChartExportOptions): AdhocPowerPointExportPayload {
  const points = transformToMultiResponseData(variables, statsData, countedValue);

  return {
    file_name: buildPowerPointFileName(fileBaseName ?? `${title}-multi-response`),
    title,
    meta_line: metaLine,
    palette,
    chart: {
      kind: "multiResponse",
      points: mapDistributionPoints(points, palette, true),
    },
  };
}
