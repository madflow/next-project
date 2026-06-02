"use client";

import { Cell, LabelList, Pie, PieChart } from "recharts";
import { ChartConfig, ChartContainer, ChartLegend, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { type ChartSortConfig, transformToRechartsPieData } from "@/lib/analysis-bridge";
import { PERCENTAGE_CHART_DECIMALS, formatChartValue } from "@/lib/chart-constants";
import { type DatasetVariable } from "@/types/dataset-variable";
import { type ThemeChartColors } from "@/types/organization";
import { type StatsResponse } from "@/types/stats";

type PieChartRendererProps = {
  variable: DatasetVariable;
  stats: StatsResponse;
  chartRef?: React.Ref<HTMLDivElement>;
  chartColors?: ThemeChartColors;
  disableAnimation?: boolean;
  sortConfig?: ChartSortConfig;
};

export function PieChartRenderer({
  variable,
  stats,
  chartRef,
  chartColors,
  disableAnimation = false,
  sortConfig,
}: PieChartRendererProps) {
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
