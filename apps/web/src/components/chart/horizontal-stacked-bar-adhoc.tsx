"use client";

import { forwardRef } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { transformToRechartsStackedBarData } from "@/lib/analysis-bridge";
import { type DatasetVariable } from "@/types/dataset-variable";
import { StatsResponse } from "@/types/stats";

type HorizontalStackedBarAdhocProps = {
  variable: DatasetVariable;
  stats: StatsResponse;
  renderAsContent?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

export const HorizontalStackedBarAdhoc = forwardRef<HTMLDivElement, HorizontalStackedBarAdhocProps>(
  ({ variable, stats }, ref) => {
    const stackedData = transformToRechartsStackedBarData(variable, stats);
    const stackedChartConfig: ChartConfig = {};
    
    // Create one horizontal bar with multiple segments
    const singleBarData = [{
      label: variable.label ?? variable.name,
      ...stackedData.reduce((acc, item, index) => {
        const key = `segment${index}`;
        stackedChartConfig[key] = {
          label: item.label,
          color: `hsl(var(--chart-${(index % 6) + 1}))`,
        };
        acc[key] = item.percentage;
        return acc;
      }, {} as Record<string, number>)
    }];

    return (
      <ChartContainer config={stackedChartConfig} ref={ref} data-export-filename={variable.name}>
        <BarChart
          layout="vertical"
          margin={{ left: 0 }}
          accessibilityLayer
          data={singleBarData}>
          <CartesianGrid vertical={true} horizontal={false} />
          <XAxis
            domain={[0, 100]}
            type="number"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            fontSize={10}
            tickFormatter={(value) => `${value}%`}
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
              fill={`var(--color-segment${index})`}
              radius={index === 0 ? [5, 0, 0, 5] : index === stackedData.length - 1 ? [0, 5, 5, 0] : [0, 0, 0, 0]}
            />
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