"use client";

import { type ChartSortConfig } from "@/lib/analysis-bridge";
import { type DatasetVariableWithAttributes } from "@/types/dataset-variable";
import { type ThemeChartColors } from "@/types/organization";
import { type AnalysisChartType, type StatsResponse } from "@/types/stats";
import { createPercentageChartConfig } from "../shared/percentage-chart-config";
import { BarChartRenderer } from "./bar/renderer";
import { HorizontalBarChartRenderer } from "./horizontal-bar/renderer";
import { HorizontalStackedBarRenderer } from "./horizontal-stacked-bar/renderer";
import { MeanBarRenderer } from "./mean-bar/renderer";
import { MetricsRenderer } from "./metrics/renderer";
import { PieChartRenderer } from "./pie/renderer";
import { TextExplorerRenderer } from "./text-explorer/renderer";

type ChartContentProps = {
  chartType: AnalysisChartType;
  variable: DatasetVariableWithAttributes;
  stats: StatsResponse;
  chartRef?: React.Ref<HTMLDivElement>;
  percentageChartConfig: ReturnType<typeof createPercentageChartConfig>;
  chartColors?: ThemeChartColors;
  datasetId?: string;
  isMultiResponseIndividual: boolean;
  countedValue: number;
  disableAnimation?: boolean;
  sortConfig?: ChartSortConfig;
};

export function ChartRendererContent({
  chartType,
  variable,
  stats,
  chartRef,
  percentageChartConfig,
  chartColors,
  datasetId,
  isMultiResponseIndividual,
  countedValue,
  disableAnimation = false,
  sortConfig,
}: ChartContentProps) {
  switch (chartType) {
    case "bar":
      return (
        <BarChartRenderer
          variable={variable}
          stats={stats}
          chartRef={chartRef}
          chartConfig={percentageChartConfig}
          chartColors={chartColors}
          disableAnimation={disableAnimation}
        />
      );
    case "horizontalBar":
      return (
        <HorizontalBarChartRenderer
          variable={variable}
          stats={stats}
          chartRef={chartRef}
          chartConfig={percentageChartConfig}
          chartColors={chartColors}
          isMultiResponseIndividual={isMultiResponseIndividual}
          countedValue={countedValue}
          disableAnimation={disableAnimation}
          sortConfig={sortConfig}
        />
      );
    case "horizontalStackedBar":
      return (
        <HorizontalStackedBarRenderer
          variable={variable}
          stats={stats}
          ref={chartRef}
          chartColors={chartColors}
          isMultiResponseIndividual={isMultiResponseIndividual}
          countedValue={countedValue}
          disableAnimation={disableAnimation}
        />
      );
    case "pie":
      return (
        <PieChartRenderer
          variable={variable}
          stats={stats}
          chartRef={chartRef}
          chartColors={chartColors}
          disableAnimation={disableAnimation}
          sortConfig={sortConfig}
        />
      );
    case "metrics":
      return <MetricsRenderer variable={variable} stats={stats} />;
    case "meanBar":
      return (
        <MeanBarRenderer
          variable={variable}
          stats={stats}
          ref={chartRef}
          chartColors={chartColors}
          disableAnimation={disableAnimation}
        />
      );
    case "textExplorer":
      return <TextExplorerRenderer variable={variable} datasetId={datasetId} />;
    default:
      return null;
  }
}
