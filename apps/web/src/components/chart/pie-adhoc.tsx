"use client";

import { DownloadIcon } from "lucide-react";
import { Pie, PieChart } from "recharts";
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
      color: `hsl(var(--chart-${colorIndex}))`,
    };
  });

  return (
    <Card className="shadow-xs" {...props}>
      <CardHeader>
        <CardTitle>{variable.label ?? variable.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} ref={ref} data-export-filename={variable.name}>
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="label" />} />
            <Pie data={rechartsData} dataKey="count" nameKey="label" />
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
