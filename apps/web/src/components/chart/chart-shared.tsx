"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, XAxis, YAxis } from "recharts";
import { ChartConfig, ChartContainer, ChartLegend, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  type ChartSortConfig,
  transformToMultiResponseIndividualBarData,
  transformToRechartsBarData,
  transformToRechartsPieData,
} from "@/lib/analysis-bridge";
import { CHART_Y_AXIS_WIDTH, PERCENTAGE_CHART_DECIMALS, formatChartValue } from "@/lib/chart-constants";
import { getPlotAreaHorizontalBorderCoordinates, getPlotAreaVerticalBorderCoordinates } from "@/lib/chart-grid";
import { type DatasetVariable } from "@/types/dataset-variable";
import { type ThemeChartColors } from "@/types/organization";
import { type StatsResponse } from "@/types/stats";

export function BarChartContent({
  variable,
  stats,
  chartRef,
  chartConfig,
  chartColors,
  disableAnimation = false,
}: {
  variable: DatasetVariable;
  stats: StatsResponse;
  chartRef?: React.Ref<HTMLDivElement>;
  chartConfig: ChartConfig;
  chartColors?: ThemeChartColors;
  disableAnimation?: boolean;
}) {
  const chartData = transformToRechartsBarData(variable, stats);

  return (
    <ChartContainer config={chartConfig} chartColors={chartColors} ref={chartRef} data-export-filename={variable.name}>
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
        />
        <Bar
          dataKey="percentage"
          fill="var(--color-percentage)"
          isAnimationActive={disableAnimation ? false : undefined}>
          {chartData.map((entry, index) => (
            <Cell key={`${entry.label}-${index}`} fill={`var(--chart-${(index % 6) + 1})`} />
          ))}
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

export function HorizontalBarChartContent({
  variable,
  stats,
  chartRef,
  chartConfig,
  chartColors,
  isMultiResponseIndividual = false,
  countedValue = 1,
  disableAnimation = false,
  sortConfig,
}: {
  variable: DatasetVariable;
  stats: StatsResponse;
  chartRef?: React.Ref<HTMLDivElement>;
  chartConfig: ChartConfig;
  chartColors?: ThemeChartColors;
  isMultiResponseIndividual?: boolean;
  countedValue?: number;
  disableAnimation?: boolean;
  sortConfig?: ChartSortConfig;
}) {
  const chartData: Array<{
    label: string | number;
    value: string | number;
    count: number;
    percentage: number;
  }> = isMultiResponseIndividual
    ? transformToMultiResponseIndividualBarData(variable, stats, countedValue)
    : transformToRechartsBarData(variable, stats, sortConfig);

  return (
    <ChartContainer config={chartConfig} chartColors={chartColors} ref={chartRef} data-export-filename={variable.name}>
      <BarChart layout="vertical" margin={{ left: 0 }} barCategoryGap={1} accessibilityLayer data={chartData}>
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
          width={isMultiResponseIndividual ? 0 : CHART_Y_AXIS_WIDTH}
          hide={isMultiResponseIndividual}
        />
        <Bar
          dataKey="percentage"
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
    </ChartContainer>
  );
}

export function PieChartContent({
  variable,
  stats,
  chartRef,
  chartColors,
  disableAnimation = false,
  sortConfig,
}: {
  variable: DatasetVariable;
  stats: StatsResponse;
  chartRef?: React.Ref<HTMLDivElement>;
  chartColors?: ThemeChartColors;
  disableAnimation?: boolean;
  sortConfig?: ChartSortConfig;
}) {
  const pieData = transformToRechartsPieData(variable, stats, sortConfig);
  const pieChartConfig: ChartConfig = {};

  pieData.forEach((item, index) => {
    pieChartConfig[item.label] = {
      label: item.label,
      color: `var(--chart-${(index % 6) + 1})`,
    };
  });

  const renderOrderedLegend = () => (
    <div className="flex flex-wrap items-center justify-center gap-4 pb-3 *:basis-1/4 *:justify-center">
      {pieData.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className="size-2 shrink-0 rounded-[2px]" style={{ backgroundColor: item.fill }} />
          <span className="text-xs">{item.label}</span>
        </div>
      ))}
    </div>
  );

  return (
    <ChartContainer
      config={pieChartConfig}
      chartColors={chartColors}
      ref={chartRef}
      data-export-filename={variable.name}>
      <PieChart>
        <ChartTooltip cursor={false} content={<ChartTooltipContent nameKey="label" />} />
        <Pie
          data={pieData}
          dataKey="percentage"
          nameKey="label"
          startAngle={90}
          endAngle={-270}
          isAnimationActive={disableAnimation ? false : undefined}>
          {pieData.map((entry, index) => (
            <Cell key={`${entry.label}-${index}`} fill={entry.fill} />
          ))}
          <LabelList
            dataKey="percentage"
            position="inside"
            fontSize={12}
            fill="white"
            formatter={(value: unknown) => `${formatChartValue(Number(value), PERCENTAGE_CHART_DECIMALS)}%`}
          />
        </Pie>
        <ChartLegend fontSize={12} verticalAlign="top" content={renderOrderedLegend} />
      </PieChart>
    </ChartContainer>
  );
}
