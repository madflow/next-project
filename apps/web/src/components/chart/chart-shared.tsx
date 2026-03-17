"use client";

import {
  BarChart3Icon,
  ChartBarBigIcon,
  ChartBarDecreasingIcon,
  ChartBarStackedIcon,
  ChartColumnBigIcon,
  ChartPieIcon,
  SheetIcon,
  TextIcon,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, XAxis, YAxis } from "recharts";
import { ChartConfig, ChartContainer, ChartLegend, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  transformToMultiResponseIndividualBarData,
  transformToRechartsBarData,
  transformToRechartsPieData,
} from "@/lib/analysis-bridge";
import { CHART_Y_AXIS_WIDTH, PERCENTAGE_CHART_DECIMALS, formatChartValue } from "@/lib/chart-constants";
import { getPlotAreaHorizontalBorderCoordinates, getPlotAreaVerticalBorderCoordinates } from "@/lib/chart-grid";
import { type DatasetVariable } from "@/types/dataset-variable";
import { type AnalysisChartType, type StatsResponse } from "@/types/stats";

type PercentageChartConfigTranslations = {
  percentLabel: string;
};

export function createPercentageChartConfig({ percentLabel }: PercentageChartConfigTranslations) {
  return {
    percentage: {
      label: percentLabel,
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;
}

export function getChartIcon(chartType: AnalysisChartType) {
  switch (chartType) {
    case "bar":
      return <ChartColumnBigIcon className="h-4 w-4" />;
    case "horizontalBar":
      return <ChartBarDecreasingIcon className="h-4 w-4" />;
    case "horizontalStackedBar":
      return <ChartBarStackedIcon className="h-4 w-4" />;
    case "pie":
      return <ChartPieIcon className="h-4 w-4" />;
    case "metrics":
      return <SheetIcon className="h-4 w-4" />;
    case "meanBar":
      return <ChartBarBigIcon className="h-4 w-4" />;
    case "textExplorer":
      return <TextIcon className="h-4 w-4" />;
    default:
      return <BarChart3Icon className="h-4 w-4" />;
  }
}

export function BarChartContent({
  variable,
  stats,
  chartRef,
  chartConfig,
}: {
  variable: DatasetVariable;
  stats: StatsResponse;
  chartRef?: React.Ref<HTMLDivElement>;
  chartConfig: ChartConfig;
}) {
  return (
    <ChartContainer config={chartConfig} ref={chartRef} data-export-filename={variable.name}>
      <BarChart accessibilityLayer data={transformToRechartsBarData(variable, stats)}>
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
        <Bar dataKey="percentage" fill="var(--color-percentage)">
          <LabelList
            dataKey="percentage"
            position="top"
            fontSize={12}
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
  isMultiResponseIndividual = false,
  countedValue = 1,
}: {
  variable: DatasetVariable;
  stats: StatsResponse;
  chartRef?: React.Ref<HTMLDivElement>;
  chartConfig: ChartConfig;
  isMultiResponseIndividual?: boolean;
  countedValue?: number;
}) {
  const chartData: Array<{
    label: string | number;
    value: string | number;
    count: number;
    percentage: number;
  }> = isMultiResponseIndividual
    ? transformToMultiResponseIndividualBarData(variable, stats, countedValue)
    : transformToRechartsBarData(variable, stats);

  return (
    <ChartContainer config={chartConfig} ref={chartRef} data-export-filename={variable.name}>
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
        <Bar dataKey="percentage" fill="var(--color-percentage)">
          <LabelList
            dataKey="percentage"
            position="right"
            fontSize={12}
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
}: {
  variable: DatasetVariable;
  stats: StatsResponse;
  chartRef?: React.Ref<HTMLDivElement>;
}) {
  const pieData = transformToRechartsPieData(variable, stats);
  const pieChartConfig: ChartConfig = {};

  pieData.forEach((item, index) => {
    pieChartConfig[item.label] = {
      label: item.label,
      color: `var(--chart-${(index % 6) + 1})`,
    };
  });

  const renderOrderedLegend = () => (
    <div className="flex -translate-y-2 flex-wrap items-center justify-center gap-4 pt-3 *:basis-1/4 *:justify-center">
      {pieData.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: item.fill }} />
          <span className="text-xs">{item.label}</span>
        </div>
      ))}
    </div>
  );

  return (
    <ChartContainer config={pieChartConfig} ref={chartRef} data-export-filename={variable.name}>
      <PieChart>
        <ChartTooltip cursor={false} content={<ChartTooltipContent nameKey="label" />} />
        <Pie data={pieData} dataKey="percentage" nameKey="label" startAngle={90} endAngle={-270}>
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
        <ChartLegend fontSize={12} content={renderOrderedLegend} />
      </PieChart>
    </ChartContainer>
  );
}
