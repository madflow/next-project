"use client";

import { DownloadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useChartExport } from "@/hooks/use-chart-export";
import { transformToMultiResponseData } from "@/lib/analysis-bridge";
import { PERCENTAGE_CHART_DECIMALS, formatChartValue } from "@/lib/chart-constants";
import { type DatasetVariableWithAttributes } from "@/types/dataset-variable";
import { StatsResponse } from "@/types/stats";
import { Button } from "../ui/button";

type MultiResponseChartProps = {
  variables: DatasetVariableWithAttributes[];
  statsData: Record<string, StatsResponse>;
  variablesetName: string;
  variablesetDescription?: string | null;
  countedValue?: number;
} & React.HTMLAttributes<HTMLDivElement>;

export function MultiResponseChart({
  variables,
  statsData,
  variablesetName,
  variablesetDescription,
  countedValue = 1,
  ...props
}: MultiResponseChartProps) {
  const t = useTranslations("chartMetricsCard");
  const { ref, exportPNG } = useChartExport();

  const chartConfig = {
    percentage: {
      label: t("percent"),
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  const chartData = transformToMultiResponseData(variables, statsData, countedValue);

  return (
    <Card className="shadow-xs" data-testid="multi-response-chart" {...props}>
      <CardHeader>
        <CardTitle>{variablesetName}</CardTitle>
        {variablesetDescription && <p className="text-muted-foreground mt-1 text-sm">{variablesetDescription}</p>}
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          ref={ref}
          data-export-filename={`${variablesetName}-multi-response`.replace(/\s+/g, "-").toLowerCase()}>
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
              width={200}
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
