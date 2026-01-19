"use client";

import { DownloadIcon } from "lucide-react";
import { Cell, LabelList, Pie, PieChart } from "recharts";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
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

  console.log(rechartsData);

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
            <ChartLegend
              fontSize={10}
              content={<ChartLegendContent nameKey="label" />}
              className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center"
            />
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
