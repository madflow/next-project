"use client";

import { forwardRef } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@repo/ui/components/chart";
import {
  hasSplitVariableStatsForVariable,
  transformToMultiResponseIndividualStackedBarData,
  transformToRechartsStackedBarData,
  transformToSplitVariableStackedBarData,
} from "@/lib/analysis-bridge";
import { PERCENTAGE_CHART_DECIMALS, formatChartValue } from "@/lib/chart-constants";
import { getPlotAreaHorizontalBorderCoordinates } from "@/lib/chart-grid";
import { getVariableLabel } from "@/lib/variable-helpers";
import { type DatasetVariable } from "@/types/dataset-variable";
import { type ThemeChartColors } from "@/types/organization";
import { type StatsResponse } from "@/types/stats";
import { AdaptiveHorizontalChart, HorizontalCategoryTick } from "../../shared/adaptive-horizontal-chart";
import {
  type HorizontalStackedBarModel,
  createSingleHorizontalStackedBarModel,
  createSplitHorizontalStackedBarModel,
} from "./model";

type HorizontalStackedBarRendererProps = {
  variable: DatasetVariable;
  stats: StatsResponse;
  chartColors?: ThemeChartColors;
  isMultiResponseIndividual?: boolean;
  countedValue?: number;
  disableAnimation?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

function PercentageLabelList({ dataKey }: { dataKey: string }) {
  return (
    <LabelList
      dataKey={dataKey}
      position="center"
      fontSize={12}
      fill="white"
      formatter={(value: unknown) =>
        Number(value) > 5 ? `${formatChartValue(Number(value), PERCENTAGE_CHART_DECIMALS)}%` : ""
      }
    />
  );
}

function MultiResponseTooltip() {
  return (
    <ChartTooltipContent
      formatter={(value, _name, item) => (
        <div className="flex items-center gap-2">
          <div
            className="size-2.5 shrink-0 rounded-[2px]"
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
  );
}

const defaultTooltipContent = <ChartTooltipContent />;
const multiResponseTooltipContent = <MultiResponseTooltip />;

export function HorizontalStackedBarChart({
  model,
  chartRef,
  exportFilename,
  hideLegend = false,
  chartColors: _chartColors,
  tooltipContent,
  disableAnimation = false,
}: {
  model: HorizontalStackedBarModel;
  chartRef?: React.Ref<HTMLDivElement>;
  exportFilename: string;
  hideLegend?: boolean;
  chartColors?: ThemeChartColors;
  tooltipContent?: React.ReactElement;
  disableAnimation?: boolean;
}) {
  void _chartColors;

  return (
    <AdaptiveHorizontalChart
      labels={model.chartData.map((entry) => entry.label)}
      chartConfig={model.chartConfig}
      chartRef={chartRef}
      exportFilename={exportFilename}
      legendItemCount={hideLegend ? 0 : model.segments.length}>
      {({ axisWidth, barSize, categoryAxisPadding, margin, wrappedLabels }) => (
        <BarChart layout="vertical" margin={margin} barCategoryGap={4} accessibilityLayer data={model.chartData}>
          <CartesianGrid vertical horizontal horizontalCoordinatesGenerator={getPlotAreaHorizontalBorderCoordinates} />
          <XAxis
            domain={[0, 100]}
            type="number"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            fontSize={12}
            ticks={[0, 20, 40, 60, 80, 100]}
            tickFormatter={(value) => `${Math.round(value)}%`}
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
          <ChartTooltip cursor={false} content={tooltipContent ?? defaultTooltipContent} />
          {model.segments.map((segment) => (
            <Bar
              key={segment.key}
              dataKey={segment.key}
              stackId="categories"
              barSize={barSize}
              fill={`var(--color-${segment.key})`}
              isAnimationActive={disableAnimation ? false : undefined}>
              <PercentageLabelList dataKey={segment.key} />
            </Bar>
          ))}
          {!hideLegend && (
            <ChartLegend
              verticalAlign="top"
              content={<ChartLegendContent verticalAlign="top" />}
              className="flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
            />
          )}
        </BarChart>
      )}
    </AdaptiveHorizontalChart>
  );
}

export const HorizontalStackedBarRenderer = forwardRef<HTMLDivElement, HorizontalStackedBarRendererProps>(
  (
    { variable, stats, chartColors, isMultiResponseIndividual = false, countedValue = 1, disableAnimation = false },
    ref
  ) => {
    const hasSplitVariable = hasSplitVariableStatsForVariable(stats, variable.name);

    if (hasSplitVariable) {
      const splitData = isMultiResponseIndividual
        ? transformToMultiResponseIndividualStackedBarData(variable, stats, countedValue)
        : transformToSplitVariableStackedBarData(variable, stats);

      const model = createSplitHorizontalStackedBarModel(splitData, !isMultiResponseIndividual);

      return (
        <HorizontalStackedBarChart
          model={model}
          chartColors={chartColors}
          chartRef={ref}
          exportFilename={variable.name}
          hideLegend={isMultiResponseIndividual}
          tooltipContent={isMultiResponseIndividual ? multiResponseTooltipContent : undefined}
          disableAnimation={disableAnimation}
        />
      );
    }

    const stackedData = transformToRechartsStackedBarData(variable, stats);
    const model = createSingleHorizontalStackedBarModel(getVariableLabel(variable), stackedData);

    return (
      <HorizontalStackedBarChart
        model={model}
        chartColors={chartColors}
        chartRef={ref}
        exportFilename={variable.name}
        disableAnimation={disableAnimation}
      />
    );
  }
);

HorizontalStackedBarRenderer.displayName = "HorizontalStackedBarRenderer";
