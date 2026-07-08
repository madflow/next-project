"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { type ChartSortConfig, transformToRechartsBarData } from "@/lib/analysis-bridge";
import { CHART_Y_AXIS_WIDTH, PERCENTAGE_CHART_DECIMALS, formatChartValue } from "@/lib/chart-constants";
import { getPlotAreaVerticalBorderCoordinates } from "@/lib/chart-grid";
import { type DatasetVariable } from "@/types/dataset-variable";
import { type ThemeChartColors } from "@/types/organization";
import { type StatsResponse } from "@/types/stats";

type BarChartRendererProps = {
  variable: DatasetVariable;
  stats: StatsResponse;
  chartRef?: React.Ref<HTMLDivElement>;
  chartConfig: ChartConfig;
  chartColors?: ThemeChartColors;
  disableAnimation?: boolean;
  sortConfig?: ChartSortConfig;
};

export function BarChartRenderer({
  variable,
  stats,
  chartRef,
  chartConfig,
  chartColors: _chartColors,
  disableAnimation = false,
  sortConfig,
}: BarChartRendererProps) {
  void _chartColors;

  const chartData = transformToRechartsBarData(variable, stats, sortConfig);

  return (
    <ChartContainer config={chartConfig} ref={chartRef} data-export-filename={variable.name}>
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical verticalCoordinatesGenerator={getPlotAreaVerticalBorderCoordinates} />
        <XAxis dataKey="label" tickLine={false} tickMargin={10} axisLine={false} fontSize={12} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        <YAxis
          domain={[0, 100]}
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          fontSize={12}
          ticks={[0, 20, 40, 60, 80, 100]}
          tickFormatter={(value) => `${value}%`}
          width={CHART_Y_AXIS_WIDTH}
        />
        <Bar
          dataKey="percentage"
          fill="var(--color-percentage)"
          isAnimationActive={disableAnimation ? false : undefined}>
          <LabelList
            dataKey="percentage"
            position="top"
            fontSize={12}
            fill="#808080"
            formatter={(value: unknown) => `${formatChartValue(Number(value), PERCENTAGE_CHART_DECIMALS)}%`}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
