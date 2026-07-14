"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts";
import { ChartConfig, ChartTooltip, ChartTooltipContent } from "@repo/ui/components/chart";
import { transformToMultiResponseData } from "@/lib/analysis-bridge";
import { PERCENTAGE_CHART_DECIMALS, formatChartValue } from "@/lib/chart-constants";
import { getPlotAreaHorizontalBorderCoordinates } from "@/lib/chart-grid";
import { type DatasetVariableWithAttributes } from "@/types/dataset-variable";
import { type ThemeChartColors } from "@/types/organization";
import { type StatsResponse } from "@/types/stats";
import { AdaptiveHorizontalChart, HorizontalCategoryTick } from "../shared/adaptive-horizontal-chart";
import { ChartExportSurface } from "../shared/export-surface";
import { ChartPanelCard } from "../shared/panel-card";
import { createPercentageChartConfig } from "../shared/percentage-chart-config";
import { useMultiResponseAggregateCardExport } from "./use-multi-response-aggregate-card-export";

const MULTI_RESPONSE_AXIS_MAX_WIDTH = 260;
const MULTI_RESPONSE_AXIS_MAX_RATIO = 0.48;

type MultiResponseAggregateCardProps = {
  variables: DatasetVariableWithAttributes[];
  statsData: Record<string, StatsResponse>;
  variablesetName: string;
  variablesetDescription?: string | null;
  countedValue?: number;
  datasetId: string;
  datasetName: string;
} & React.HTMLAttributes<HTMLDivElement>;

export function MultiResponseAggregateChartContent({
  chartConfig,
  chartColors,
  chartData,
  chartRef,
  fileName,
  disableAnimation = false,
}: {
  chartConfig: ChartConfig;
  chartColors?: ThemeChartColors;
  chartData: ReturnType<typeof transformToMultiResponseData>;
  chartRef?: React.Ref<HTMLDivElement>;
  fileName: string;
  disableAnimation?: boolean;
}) {
  return (
    <AdaptiveHorizontalChart
      labels={chartData.map((entry) => entry.label)}
      chartConfig={chartConfig}
      chartColors={chartColors}
      chartRef={chartRef}
      categoryAxisMaxRatio={MULTI_RESPONSE_AXIS_MAX_RATIO}
      categoryAxisMaxWidth={MULTI_RESPONSE_AXIS_MAX_WIDTH}
      exportFilename={fileName}
      rightMargin={48}>
      {({ axisWidth, barSize, categoryAxisPadding, margin, wrappedLabels }) => (
        <BarChart layout="vertical" margin={margin} barCategoryGap={4} accessibilityLayer data={chartData}>
          <CartesianGrid vertical horizontal horizontalCoordinatesGenerator={getPlotAreaHorizontalBorderCoordinates} />
          <XAxis
            domain={[0, 100]}
            dataKey="percentage"
            type="number"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            fontSize={12}
            ticks={[0, 20, 40, 60, 80, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <YAxis
            dataKey="label"
            type="category"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            fontSize={12}
            width={axisWidth}
            interval={0}
            padding={categoryAxisPadding}
            tick={(tickProps) => <HorizontalCategoryTick {...tickProps} lines={wrappedLabels[tickProps.index] ?? []} />}
          />
          <Bar
            dataKey="percentage"
            barSize={barSize}
            fill="var(--color-percentage)"
            isAnimationActive={disableAnimation ? false : undefined}>
            {chartData.map((entry, index) => (
              <Cell key={`${entry.label}-${index}`} fill={`var(--chart-${(index % 6) + 1})`} />
            ))}
            <LabelList
              dataKey="percentage"
              position="right"
              fontSize={12}
              fill="#808080"
              formatter={(value: unknown) => `${formatChartValue(Number(value), PERCENTAGE_CHART_DECIMALS)}%`}
            />
          </Bar>
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        </BarChart>
      )}
    </AdaptiveHorizontalChart>
  );
}

export function MultiResponseAggregateCard({
  variables,
  statsData,
  variablesetName,
  variablesetDescription,
  countedValue = 1,
  datasetId,
  datasetName,
  ...props
}: MultiResponseAggregateCardProps) {
  const [sortByCountDesc, setSortByCountDesc] = useState(false);

  const chartData = useMemo(() => {
    const data = transformToMultiResponseData(variables, statsData, countedValue);
    if (sortByCountDesc) {
      return [...data].sort((a: (typeof data)[number], b: (typeof data)[number]) => b.percentage - a.percentage);
    }
    return data;
  }, [countedValue, sortByCountDesc, statsData, variables]);
  const {
    chartColors,
    displayRef,
    exportBaseName,
    exportPNG,
    exportRef,
    handleExcelExport,
    handlePowerPointExport,
    isExportRendering,
    percentageLabel,
  } = useMultiResponseAggregateCardExport({
    countedValue,
    datasetId,
    datasetName,
    sortByCountDesc,
    statsData,
    variables,
    variablesetName,
  });
  const chartConfig = useMemo(() => createPercentageChartConfig({ percentLabel: percentageLabel }), [percentageLabel]);
  const chartContent = (
    <MultiResponseAggregateChartContent
      chartConfig={chartConfig}
      chartColors={chartColors}
      chartData={chartData}
      chartRef={displayRef}
      fileName={exportBaseName}
    />
  );

  return (
    <div data-testid="multi-response-chart" {...props}>
      <ChartExportSurface exportRef={exportRef} fileName={exportBaseName} isRendering={isExportRendering}>
        <MultiResponseAggregateChartContent
          chartConfig={chartConfig}
          chartColors={chartColors}
          chartData={chartData}
          fileName={exportBaseName}
          disableAnimation
        />
      </ChartExportSurface>
      <ChartPanelCard
        title={variablesetName}
        description={variablesetDescription ?? null}
        chartContent={chartContent}
        exportable
        onExportImageAction={exportPNG}
        onExportExcelAction={handleExcelExport}
        onExportPowerPointAction={handlePowerPointExport}
        exportDisabled={false}
        availableChartTypes={[]}
        selectedChartType="horizontalBar"
        onChartTypeChangeAction={() => {}}
        sortByCountDesc={sortByCountDesc}
        onSortByCountDescChangeAction={setSortByCountDesc}
      />
    </div>
  );
}
