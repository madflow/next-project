"use client";

import { forwardRef } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
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
import { type StatsResponse } from "@/types/stats";
import {
  type HorizontalStackedBarModel,
  createSingleHorizontalStackedBarModel,
  createSplitHorizontalStackedBarModel,
} from "./horizontal-stacked-bar-model";

type HorizontalStackedBarAdhocProps = {
  variable: DatasetVariable;
  stats: StatsResponse;
  isMultiResponseIndividual?: boolean;
  countedValue?: number;
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
  );
}

const defaultTooltipContent = <ChartTooltipContent />;
const multiResponseTooltipContent = <MultiResponseTooltip />;

function HorizontalStackedBarChart({
  model,
  chartRef,
  exportFilename,
  hideLegend = false,
  tooltipContent,
}: {
  model: HorizontalStackedBarModel;
  chartRef?: React.Ref<HTMLDivElement>;
  exportFilename: string;
  hideLegend?: boolean;
  tooltipContent?: React.ReactElement;
}) {
  return (
    <ChartContainer config={model.chartConfig} ref={chartRef} data-export-filename={exportFilename}>
      <BarChart layout="vertical" margin={{ left: 0 }} accessibilityLayer data={model.chartData}>
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
          width={100}
        />
        <ChartTooltip cursor={false} content={tooltipContent ?? defaultTooltipContent} />
        {model.segments.map((segment) => (
          <Bar key={segment.key} dataKey={segment.key} stackId="categories" fill={`var(--color-${segment.key})`}>
            <PercentageLabelList dataKey={segment.key} />
          </Bar>
        ))}
        {!hideLegend && (
          <ChartLegend
            content={<ChartLegendContent />}
            className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
          />
        )}
      </BarChart>
    </ChartContainer>
  );
}

export const HorizontalStackedBarAdhoc = forwardRef<HTMLDivElement, HorizontalStackedBarAdhocProps>(
  ({ variable, stats, isMultiResponseIndividual = false, countedValue = 1 }, ref) => {
    const hasSplitVariable = hasSplitVariableStatsForVariable(stats, variable.name);

    if (hasSplitVariable) {
      const splitData = isMultiResponseIndividual
        ? transformToMultiResponseIndividualStackedBarData(variable, stats, countedValue)
        : transformToSplitVariableStackedBarData(variable, stats);

      const model = createSplitHorizontalStackedBarModel(splitData, !isMultiResponseIndividual);

      return (
        <HorizontalStackedBarChart
          model={model}
          chartRef={ref}
          exportFilename={variable.name}
          hideLegend={isMultiResponseIndividual}
          tooltipContent={isMultiResponseIndividual ? multiResponseTooltipContent : undefined}
        />
      );
    }

    const stackedData = transformToRechartsStackedBarData(variable, stats);
    const model = createSingleHorizontalStackedBarModel(getVariableLabel(variable), stackedData);

    return <HorizontalStackedBarChart model={model} chartRef={ref} exportFilename={variable.name} />;
  }
);

HorizontalStackedBarAdhoc.displayName = "HorizontalStackedBarAdhoc";
