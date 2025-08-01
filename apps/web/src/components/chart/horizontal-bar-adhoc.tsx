"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { transformToRechartsBarData } from "@/lib/analysis-bridge";
import { type DatasetVariable } from "@/types/dataset-variable";
import { StatsResponse } from "@/types/stats";

const chartConfig = {
  count: {
    label: "Anzahl",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

type BarAdhocProps = {
  variable: DatasetVariable;
  stats: StatsResponse;
} & React.HTMLAttributes<HTMLDivElement>;

export function HorizontalBarAdhoc({ variable, stats, ...props }: BarAdhocProps) {
  return (
    <Card className="shadow-xs" {...props}>
      <CardHeader>
        <CardTitle>{variable.label ?? variable.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            layout="vertical"
            margin={{
              left: 0,
            }}
            barCategoryGap={1}
            accessibilityLayer
            data={transformToRechartsBarData(variable, stats)}>
            <CartesianGrid vertical={true} horizontal={false} />
            <XAxis dataKey="count" type="number" tickLine={false} tickMargin={10} axisLine={false} fontSize={10} />
            <YAxis
              dataKey="label"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              fontSize={10}
              width={200}
            />
            <Bar dataKey="count" fill="var(--color-count)" radius={5} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
