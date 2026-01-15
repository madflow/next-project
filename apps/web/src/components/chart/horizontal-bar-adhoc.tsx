"use client";

import { DownloadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useChartExport } from "@/hooks/use-chart-export";
import { transformToRechartsBarData } from "@/lib/analysis-bridge";
import { CHART_Y_AXIS_WIDTH, PERCENTAGE_CHART_DECIMALS, formatChartValue } from "@/lib/chart-constants";
import { type DatasetVariable } from "@/types/dataset-variable";
import { StatsResponse } from "@/types/stats";
import { Button } from "../ui/button";

type BarAdhocProps = {
  variable: DatasetVariable;
  stats: StatsResponse;
} & React.HTMLAttributes<HTMLDivElement>;

export function HorizontalBarAdhoc({ variable, stats, ...props }: BarAdhocProps) {
  const t = useTranslations("chartMetricsCard");
  const { ref, exportPNG } = useChartExport();

  const chartConfig = {
    percentage: {
      label: t("percent"),
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  return (
    <Card className="shadow-xs" {...props}>
      <CardHeader>
        <CardTitle>{variable.label ?? variable.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} ref={ref} data-export-filename={variable.name}>
          <BarChart
            layout="vertical"
            margin={{
              left: 0,
            }}
            barCategoryGap={1}
            accessibilityLayer
            data={transformToRechartsBarData(variable, stats)}>
            <CartesianGrid vertical={true} horizontal={false} />
            <XAxis
              domain={[0, 100]}
              dataKey="percentage"
              type="number"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              fontSize={10}
              ticks={[0, 20, 40, 60, 80, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <YAxis
              dataKey="label"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              fontSize={10}
              width={CHART_Y_AXIS_WIDTH}
            />
            <Bar dataKey="percentage" fill="var(--color-percentage)">
              <LabelList
                dataKey="percentage"
                position="right"
                fontSize={10}
                formatter={(value: number) => `${formatChartValue(value, PERCENTAGE_CHART_DECIMALS)}%`}
              />
            </Bar>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
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
