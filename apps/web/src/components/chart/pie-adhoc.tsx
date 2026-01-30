"use client";

import { DownloadIcon } from "lucide-react";
import { Cell, LabelList, Pie, PieChart } from "recharts";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartLegend, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useChartExport } from "@/hooks/use-chart-export";
import { transformToRechartsPieData } from "@/lib/analysis-bridge";
import { PERCENTAGE_CHART_DECIMALS, formatChartValue } from "@/lib/chart-constants";
import { getVariableLabel } from "@/lib/variable-helpers";
import { type DatasetVariable } from "@/types/dataset-variable";
import { StatsResponse } from "@/types/stats";
import { Button } from "../ui/button";

type PieAdhocProps = {
  variable: DatasetVariable;
  stats: StatsResponse;
} & React.HTMLAttributes<HTMLDivElement>;

export function PieAdhoc({ variable, stats, ...props }: PieAdhocProps) {
  const { ref, exportPNG } = useChartExport();
  const rechartsData = transformToRechartsPieData(variable, stats);
  const chartConfig: ChartConfig = {};

  // Create dynamic configuration that uses the chart color variables
  rechartsData.forEach((item, index) => {
    const key: string = item.label;
    const colorIndex = (index % 6) + 1; // Cycle through chart-1 to chart-6
    chartConfig[key] = {
      label: item.label,
      color: `var(--chart-${colorIndex})`,
    };
  });

  // Render custom legend that preserves the data order (sorted by numeric value)
  const renderOrderedLegend = () => (
    <div className="flex -translate-y-2 flex-wrap items-center justify-center gap-4 pt-3 *:basis-1/4 *:justify-center">
      {rechartsData.map((item, index) => {
        const colorIndex = (index % 6) + 1;
        return (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: `var(--chart-${colorIndex})` }} />
            <span className="text-xs">{item.label}</span>
          </div>
        );
      })}
    </div>
  );

  return (
    <Card className="shadow-xs" {...props}>
      <CardHeader>
        <CardTitle>{getVariableLabel(variable)}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} ref={ref} data-export-filename={variable.name}>
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent nameKey="label" />} />
            <Pie data={rechartsData} dataKey="percentage" nameKey="label" startAngle={90} endAngle={-270}>
              <LabelList
                dataKey="percentage"
                position="inside"
                fill="white"
                fontSize={12}
                formatter={(value: unknown) => `${formatChartValue(Number(value), PERCENTAGE_CHART_DECIMALS)}%`}
              />
              {rechartsData.map((entry, index) => {
                const colorIndex = (index % 6) + 1;
                return <Cell key={`cell-${index}`} fill={`var(--chart-${colorIndex})`} />;
              })}
            </Pie>
            <ChartLegend fontSize={10} content={renderOrderedLegend} />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <Button className="cursor-pointer" variant="outline" onClick={exportPNG}>
          <DownloadIcon className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
