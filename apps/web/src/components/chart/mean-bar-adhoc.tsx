"use client";

import { DownloadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useChartExport } from "@/hooks/use-chart-export";
import { type DatasetVariable } from "@/types/dataset-variable";
import { StatsResponse } from "@/types/stats";
import { Button } from "../ui/button";

type MeanBarAdhocProps = {
  variable: DatasetVariable;
  stats: StatsResponse;
  renderAsContent?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

export function MeanBarAdhoc({ variable, stats, renderAsContent, ...props }: MeanBarAdhocProps) {
  const t = useTranslations("chartMetricsCard");
  const { ref, exportPNG } = useChartExport();

  // Find the stats for this variable
  const variableStats = stats.find(item => item.variable === variable.name)?.stats;
  if (!variableStats) return null;

  // Create data for mean and median bars
  const chartData = [
    {
      label: t("mean"),
      value: variableStats.mean,
    },
    {
      label: t("median"),
      value: variableStats.median,
    },
  ];

  // Use the max value from stats for the domain
  const maxValue = variableStats.max;

  const chartConfig = {
    value: {
      label: "Value",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  const chartContent = (
    <ChartContainer config={chartConfig} ref={ref} data-export-filename={variable.name}>
      <BarChart
        layout="vertical"
        margin={{
          left: 0,
        }}
        barCategoryGap={1}
        accessibilityLayer
        data={chartData}>
        <CartesianGrid vertical={true} horizontal={false} />
        <XAxis
          domain={[0, maxValue]}
          dataKey="value"
          type="number"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          fontSize={10}
        />
        <YAxis
          dataKey="label"
          type="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          fontSize={10}
          width={200}
        />
        <Bar dataKey="value" fill="var(--color-value)" radius={5} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
      </BarChart>
    </ChartContainer>
  );

  if (renderAsContent) {
    return chartContent;
  }

  return (
    <Card className="shadow-xs" {...props}>
      <CardHeader>
        <CardTitle>{variable.label ?? variable.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {chartContent}
      </CardContent>

      <CardFooter>
        <Button className="cursor-pointer" variant="outline" onClick={exportPNG}>
          <DownloadIcon className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}