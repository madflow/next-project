"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { ChartConfig, ChartTooltip, ChartTooltipContent } from "@repo/ui/components/chart";
import {
  type ChartSortConfig,
  transformToMultiResponseIndividualBarData,
  transformToRechartsBarData,
} from "@/lib/analysis-bridge";
import { PERCENTAGE_CHART_DECIMALS, formatChartValue } from "@/lib/chart-constants";
import { getPlotAreaHorizontalBorderCoordinates } from "@/lib/chart-grid";
import { type DatasetVariable } from "@/types/dataset-variable";
import { type ThemeChartColors } from "@/types/organization";
import { type StatsResponse } from "@/types/stats";
import { AdaptiveHorizontalChart, HorizontalCategoryTick } from "../../shared/adaptive-horizontal-chart";

type HorizontalBarChartRendererProps = {
  variable: DatasetVariable;
  stats: StatsResponse;
  chartRef?: React.Ref<HTMLDivElement>;
  chartConfig: ChartConfig;
  chartColors?: ThemeChartColors;
  isMultiResponseIndividual?: boolean;
  countedValue?: number;
  disableAnimation?: boolean;
  sortConfig?: ChartSortConfig;
};

export function HorizontalBarChartRenderer({
  variable,
  stats,
  chartRef,
  chartConfig,
  chartColors,
  isMultiResponseIndividual = false,
  countedValue = 1,
  disableAnimation = false,
  sortConfig,
}: HorizontalBarChartRendererProps) {
  const chartData: Array<{
    label: string | number;
    value: string | number;
    count: number;
    percentage: number;
  }> = isMultiResponseIndividual
    ? transformToMultiResponseIndividualBarData(variable, stats, countedValue)
    : transformToRechartsBarData(variable, stats, sortConfig);

  return (
    <AdaptiveHorizontalChart
      labels={chartData.map((entry) => entry.label)}
      chartConfig={chartConfig}
      chartColors={chartColors}
      chartRef={chartRef}
      exportFilename={variable.name}
      hideCategoryAxis={isMultiResponseIndividual}
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
            hide={isMultiResponseIndividual}
            padding={categoryAxisPadding}
            tick={(tickProps) => <HorizontalCategoryTick {...tickProps} lines={wrappedLabels[tickProps.index] ?? []} />}
          />
          <Bar
            dataKey="percentage"
            barSize={barSize}
            fill="var(--color-percentage)"
            isAnimationActive={disableAnimation ? false : undefined}>
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
