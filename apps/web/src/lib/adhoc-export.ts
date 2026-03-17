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

export type AdhocPowerPointChartSpec =
  | DistributionChartSpec
  | HorizontalStackedBarChartSpec
  | PieChartSpec
  | MeanBarChartSpec
  | MetricsChartSpec;

export type AdhocPowerPointExportPayload = {
  file_name: string;
  title: string;
  meta_line: string;
  palette: string[];
  chart: AdhocPowerPointChartSpec;
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

type MultiResponseChartExportOptions = {
  countedValue?: number;
  fileBaseName?: string;
  metaLine: string;
  palette: string[];
  statsData: Record<string, StatsResponse>;
  title: string;
  variables: DatasetVariableWithAttributes[];
};

function roundExportValue(value: number) {
  return Math.round(value * 100) / 100;
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
  colorIndex: number = 0
) {
  const color = palette[colorIndex] ?? DEFAULT_EXPORT_PALETTE[0];
  return points.map((point) => ({
    label: String(point.label),
    value: roundExportValue(point.percentage),
    color,
  }));
}

export function getExportPalette(chartColors?: ThemeItem["chartColors"] | null) {
  return EXPORT_PALETTE_KEYS.map((key, index) => chartColors?.[key] ?? DEFAULT_EXPORT_PALETTE[index]!);
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
          points: mapDistributionPoints(transformToRechartsBarData(variable, stats), palette),
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
          points: mapDistributionPoints(points, palette),
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
      points: mapDistributionPoints(points, palette),
    },
  };
}
