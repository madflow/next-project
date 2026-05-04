"use client";

import { useTranslations } from "next-intl";
import { forwardRef } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { extractVariableStats } from "@/lib/analysis-bridge";
import { CHART_Y_AXIS_WIDTH, MEAN_BAR_DECIMALS, formatChartValue } from "@/lib/chart-constants";
import { getPlotAreaHorizontalBorderCoordinates } from "@/lib/chart-grid";
import { type DatasetVariableWithAttributes } from "@/types/dataset-variable";
import { type ThemeChartColors } from "@/types/organization";
import { type StatsResponse } from "@/types/stats";

type MeanBarAdhocProps = {
  variable: DatasetVariableWithAttributes;
  stats: StatsResponse;
  chartColors?: ThemeChartColors;
} & React.HTMLAttributes<HTMLDivElement>;

export const MeanBarAdhoc = forwardRef<HTMLDivElement, MeanBarAdhocProps>(({ variable, stats, chartColors }, ref) => {
  const t = useTranslations("chartMetricsCard");
  const variableStats = extractVariableStats(variable, stats);
  if (!variableStats) {
    return null;
  }

  const chartData = [
    {
      label: t("mean"),
      value: variableStats.mean,
    },
    {
      label: t("median"),
      value: variableStats.median,
    },
  ];

  const valueRange = variable.attributes?.valueRange;
  const maxValue = valueRange?.max ?? variableStats.max;
  const minValue = valueRange?.min ?? variableStats.min;

  const chartConfig = {
    value: {
      label: "Value",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={chartConfig} chartColors={chartColors} ref={ref} data-export-filename={variable.name}>
      <BarChart layout="vertical" margin={{ left: 0 }} barCategoryGap={1} accessibilityLayer data={chartData}>
        <CartesianGrid vertical horizontal horizontalCoordinatesGenerator={getPlotAreaHorizontalBorderCoordinates} />
        <XAxis
          domain={[minValue, maxValue]}
          dataKey="value"
          type="number"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          fontSize={12}
        />
        <YAxis
          dataKey="label"
          type="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          fontSize={12}
          width={CHART_Y_AXIS_WIDTH}
        />
        <Bar dataKey="value" fill="var(--color-value)">
          {chartData.map((entry, index) => (
            <Cell key={`${entry.label}-${index}`} fill={`var(--chart-${(index % 6) + 1})`} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            fill="#808080"
            formatter={(value: unknown) => `${formatChartValue(Number(value), MEAN_BAR_DECIMALS)}`}
          />
        </Bar>
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
      </BarChart>
    </ChartContainer>
  );
});

MeanBarAdhoc.displayName = "MeanBarAdhoc";
