"use client";

import { forwardRef } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  isSplitVariableStats,
  transformToMultiResponseIndividualStackedBarData,
  transformToRechartsStackedBarData,
  transformToSplitVariableStackedBarData,
} from "@/lib/analysis-bridge";
import { PERCENTAGE_CHART_DECIMALS, formatChartValue } from "@/lib/chart-constants";
import { getVariableLabel } from "@/lib/variable-helpers";
import { type DatasetVariable } from "@/types/dataset-variable";
import { StatsResponse } from "@/types/stats";

type HorizontalStackedBarAdhocProps = {
  variable: DatasetVariable;
  stats: StatsResponse;
  renderAsContent?: boolean;
  isMultiResponseIndividual?: boolean;
  countedValue?: number;
} & React.HTMLAttributes<HTMLDivElement>;

type SplitDataItem = {
  category: string;
  categoryKey: string;
  categoryIndex: number;
  segments: Array<{
    segment: string;
    value: number;
    label: string;
    count: number;
    color: string;
  }>;
};

export const HorizontalStackedBarAdhoc = forwardRef<HTMLDivElement, HorizontalStackedBarAdhocProps>(
  ({ variable, stats, isMultiResponseIndividual = false, countedValue = 1 }, ref) => {
    // Check if we have split variable data
    const targetVariable = stats.find((item) => item.variable === variable.name);
    const hasSplitVariable = targetVariable && isSplitVariableStats(targetVariable.stats);

    if (hasSplitVariable) {
      // Handle split variable rendering - multiple bars
      // Use different transformation for multi-response individual
      const splitData = (
        isMultiResponseIndividual
          ? transformToMultiResponseIndividualStackedBarData(variable, stats, countedValue)
          : transformToSplitVariableStackedBarData(variable, stats)
      ) as SplitDataItem[];

      // Create chart data with a bar for each split category
      const chartData = splitData.filter(Boolean).map((categoryData: SplitDataItem) => {
        const barData: Record<string, unknown> = {
          label: categoryData.category,
        };

        // For multi-response individual, DO NOT normalize - show actual percentages
        // For regular stacked bars, normalize to ensure sum equals exactly 100%
        const totalPercentage = categoryData.segments.reduce((sum, segment) => sum + segment.value, 0);
        const normalizationFactor = isMultiResponseIndividual ? 1 : totalPercentage > 0 ? 100 / totalPercentage : 1;

        // Add each segment as a separate field for stacking
        categoryData.segments.forEach((segment, index: number) => {
          const normalizedValue = Math.round(segment.value * normalizationFactor * 100) / 100;
          barData[`segment${index}`] = normalizedValue;
        });

        return barData;
      });

      // Create chart config for all segments
      const chartConfig: ChartConfig = {};
      if (splitData.length > 0 && splitData[0]) {
        splitData[0].segments.forEach((segment, index: number) => {
          chartConfig[`segment${index}`] = {
            label: segment.label,
            color: segment.color,
          };
        });
      }

      return (
        <ChartContainer config={chartConfig} ref={ref} data-export-filename={variable.name}>
          <BarChart layout="vertical" margin={{ left: 0 }} accessibilityLayer data={chartData}>
            <CartesianGrid vertical={true} horizontal={false} />
            <XAxis
              domain={[0, 100]}
              type="number"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              fontSize={10}
              ticks={[0, 20, 40, 60, 80, 100]}
              tickFormatter={(value) => `${Math.round(value)}%`}
            />
            <YAxis
              dataKey="label"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              fontSize={10}
              width={100}
            />
            <ChartTooltip
              cursor={false}
              content={
                isMultiResponseIndividual ? (
                  <ChartTooltipContent
                    formatter={(value, name, item) => (
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                          style={{
                            backgroundColor: item.payload.fill || item.color,
                          }}
                        />
                        <span className="text-foreground font-mono font-medium tabular-nums">
                          {`${formatChartValue(Number(value), PERCENTAGE_CHART_DECIMALS)}%`}
                        </span>
                      </div>
                    )}
                  />
                ) : (
                  <ChartTooltipContent />
                )
              }
            />
            {splitData.length > 0 &&
              splitData[0] &&
              splitData[0].segments.map((_, index) => (
                <Bar
                  key={`segment${index}`}
                  dataKey={`segment${index}`}
                  stackId="categories"
                  fill={`var(--color-segment${index})`}>
                  <LabelList
                    dataKey={`segment${index}`}
                    position="center"
                    fontSize={10}
                    fill="white"
                    formatter={(value: unknown) =>
                      Number(value) > 5 ? `${formatChartValue(Number(value), PERCENTAGE_CHART_DECIMALS)}%` : ""
                    }
                  />
                </Bar>
              ))}
            {!isMultiResponseIndividual && (
              <ChartLegend
                content={<ChartLegendContent />}
                className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
              />
            )}
          </BarChart>
        </ChartContainer>
      );
    }

    // Original single variable rendering
    const stackedData = transformToRechartsStackedBarData(variable, stats);
    const stackedChartConfig: ChartConfig = {};

    // Calculate total and normalize to ensure sum equals exactly 100%
    const totalPercentage = stackedData.reduce((sum, item) => sum + item.percentage, 0);
    const normalizationFactor = totalPercentage > 0 ? 100 / totalPercentage : 1;

    // Create one horizontal bar with multiple segments
    const singleBarData = [
      {
        label: getVariableLabel(variable),
        ...stackedData.reduce(
          (acc, item, index) => {
            const key = `segment${index}`;
            stackedChartConfig[key] = {
              label: item.label,
              color: `var(--chart-${(index % 6) + 1})`,
            };
            const normalizedValue = Math.round(item.percentage * normalizationFactor * 100) / 100;
            acc[key] = normalizedValue;
            return acc;
          },
          {} as Record<string, number>
        ),
      },
    ];

    return (
      <ChartContainer config={stackedChartConfig} ref={ref} data-export-filename={variable.name}>
        <BarChart layout="vertical" margin={{ left: 0 }} accessibilityLayer data={singleBarData}>
          <CartesianGrid vertical={true} horizontal={false} />
          <XAxis
            domain={[0, 100]}
            type="number"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            fontSize={10}
            ticks={[0, 20, 40, 60, 80, 100]}
            tickFormatter={(value) => `${Math.round(value)}%`}
          />
          <YAxis
            dataKey="label"
            type="category"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            fontSize={10}
            width={100}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          {stackedData.map((_, index) => (
            <Bar
              key={`segment${index}`}
              dataKey={`segment${index}`}
              stackId="categories"
              fill={`var(--color-segment${index})`}>
              <LabelList
                dataKey={`segment${index}`}
                position="center"
                fontSize={10}
                fill="white"
                formatter={(value: unknown) =>
                  Number(value) > 5 ? `${formatChartValue(Number(value), PERCENTAGE_CHART_DECIMALS)}%` : ""
                }
              />
            </Bar>
          ))}
          <ChartLegend
            content={<ChartLegendContent />}
            className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
          />
        </BarChart>
      </ChartContainer>
    );
  }
);

HorizontalStackedBarAdhoc.displayName = "HorizontalStackedBarAdhoc";
