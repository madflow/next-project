"use client";

import { useTranslations } from "next-intl";
import { forwardRef } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts";
import { type ChartConfig, ChartTooltip, ChartTooltipContent } from "@repo/ui/components/chart";
import { extractVariableStats } from "@/lib/analysis-bridge";
import { MEAN_BAR_DECIMALS, formatChartValue } from "@/lib/chart-constants";
import { getPlotAreaHorizontalBorderCoordinates } from "@/lib/chart-grid";
import { type DatasetVariableWithAttributes } from "@/types/dataset-variable";
import { type ThemeChartColors } from "@/types/organization";
import { type StatsResponse } from "@/types/stats";
import { AdaptiveHorizontalChart, HorizontalCategoryTick } from "../../shared/adaptive-horizontal-chart";

type MeanBarRendererProps = {
  variable: DatasetVariableWithAttributes;
  stats: StatsResponse;
  chartColors?: ThemeChartColors;
  disableAnimation?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

export const MeanBarRenderer = forwardRef<HTMLDivElement, MeanBarRendererProps>(
  ({ variable, stats, chartColors, disableAnimation = false }, ref) => {
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
      <AdaptiveHorizontalChart
        labels={chartData.map((entry) => entry.label)}
        chartConfig={chartConfig}
        chartColors={chartColors}
        chartRef={ref}
        exportFilename={variable.name}
        rightMargin={48}>
        {({ axisWidth, barSize, categoryAxisPadding, margin, wrappedLabels }) => (
          <BarChart layout="vertical" margin={margin} barCategoryGap={4} accessibilityLayer data={chartData}>
            <CartesianGrid
              vertical
              horizontal
              horizontalCoordinatesGenerator={getPlotAreaHorizontalBorderCoordinates}
            />
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
              width={axisWidth}
              interval={0}
              padding={categoryAxisPadding}
              tick={(tickProps) => (
                <HorizontalCategoryTick {...tickProps} lines={wrappedLabels[tickProps.index] ?? []} />
              )}
            />
            <Bar
              dataKey="value"
              barSize={barSize}
              fill="var(--color-value)"
              isAnimationActive={disableAnimation ? false : undefined}>
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
        )}
      </AdaptiveHorizontalChart>
    );
  }
);

MeanBarRenderer.displayName = "MeanBarRenderer";
