import { type ChartConfig } from "@/components/ui/chart";
import type { RechartsStackedBarDataItem, SplitVariableStackedBarDataItem } from "@/lib/analysis-bridge";

export type HorizontalStackedBarSegment = {
  key: string;
  label: string;
  color: string;
};

export type HorizontalStackedBarChartRow = {
  label: string;
  [key: string]: string | number;
};

export type HorizontalStackedBarModel = {
  chartConfig: ChartConfig;
  chartData: HorizontalStackedBarChartRow[];
  segments: HorizontalStackedBarSegment[];
};

function roundChartPercentage(value: number) {
  return Math.round(value * 100) / 100;
}

function getNormalizationFactor(totalPercentage: number, shouldNormalize: boolean) {
  if (!shouldNormalize || totalPercentage <= 0) {
    return 1;
  }

  return 100 / totalPercentage;
}

function createChartConfig(segments: HorizontalStackedBarSegment[]) {
  const chartConfig: ChartConfig = {};

  for (const segment of segments) {
    chartConfig[segment.key] = {
      label: segment.label,
      color: segment.color,
    };
  }

  return chartConfig;
}

export function createSplitHorizontalStackedBarModel(
  splitData: SplitVariableStackedBarDataItem[],
  shouldNormalize: boolean = true
): HorizontalStackedBarModel {
  const segments =
    splitData[0]?.segments.map((segment, index) => ({
      key: segment.segment || `segment${index}`,
      label: segment.label,
      color: segment.color,
    })) ?? [];

  const chartData = splitData.map((categoryData) => {
    const row: HorizontalStackedBarChartRow = {
      label: categoryData.category,
    };

    const totalPercentage = categoryData.segments.reduce((sum, segment) => sum + segment.value, 0);
    const normalizationFactor = getNormalizationFactor(totalPercentage, shouldNormalize);

    categoryData.segments.forEach((segment, index) => {
      const segmentKey = segments[index]?.key ?? (segment.segment || `segment${index}`);
      row[segmentKey] = roundChartPercentage(segment.value * normalizationFactor);
    });

    return row;
  });

  return {
    chartConfig: createChartConfig(segments),
    chartData,
    segments,
  };
}

export function createSingleHorizontalStackedBarModel(
  variableLabel: string,
  stackedData: RechartsStackedBarDataItem[]
): HorizontalStackedBarModel {
  const segments = stackedData.map((item, index) => ({
    key: `segment${index}`,
    label: String(item.label),
    color: item.fill,
  }));

  const totalPercentage = stackedData.reduce((sum, item) => sum + item.percentage, 0);
  const normalizationFactor = getNormalizationFactor(totalPercentage, true);
  const row: HorizontalStackedBarChartRow = {
    label: variableLabel,
  };

  stackedData.forEach((item, index) => {
    const segment = segments[index];
    if (!segment) {
      return;
    }

    row[segment.key] = roundChartPercentage(item.percentage * normalizationFactor);
  });

  return {
    chartConfig: createChartConfig(segments),
    chartData: [row],
    segments,
  };
}
