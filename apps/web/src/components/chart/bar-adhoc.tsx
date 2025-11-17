"use client";

import { DownloadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useChartExport } from "@/hooks/use-chart-export";
import { transformToRechartsBarData } from "@/lib/analysis-bridge";
import { PERCENTAGE_CHART_DECIMALS, formatChartValue } from "@/lib/chart-constants";
import { type DatasetVariable } from "@/types/dataset-variable";
import { StatsResponse } from "@/types/stats";
import { Button } from "../ui/button";

type BarAdhocProps = {
  variable: DatasetVariable;
  stats: StatsResponse;
} & React.HTMLAttributes<HTMLDivElement>;

export function BarAdhoc({ variable, stats, ...props }: BarAdhocProps) {
  const t = useTranslations("chartMetricsCard");
  const { ref, exportPNG } = useChartExport();

  const chartConfig = {
    percentage: {
      label: t("percent"),
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  return (
    <Card className="shadow-xs" {...props}>
      <CardHeader>
        <CardTitle>{variable.label ?? variable.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} ref={ref} data-export-filename={variable.name}>
          <BarChart accessibilityLayer data={transformToRechartsBarData(variable, stats)}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} tickMargin={10} axisLine={false} fontSize={10} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <YAxis
              domain={[0, 100]}
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              fontSize={10}
              ticks={[0, 20, 40, 60, 80, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Bar dataKey="percentage" fill="var(--color-percentage)">
              <LabelList
                dataKey="percentage"
                position="top"
                formatter={(value: number) => `${formatChartValue(value, PERCENTAGE_CHART_DECIMALS)}%`}
              />
            </Bar>
          </BarChart>
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
