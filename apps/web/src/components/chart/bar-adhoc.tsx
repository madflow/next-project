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
};

export function BarAdhoc({ variable, stats }: BarAdhocProps) {
  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle>{variable.label ?? variable.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={transformToRechartsBarData(variable, stats)}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} tickMargin={10} axisLine={false} fontSize={10} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <YAxis tickLine={false} tickMargin={10} axisLine={false} fontSize={10} />
            <Bar dataKey="count" fill="var(--color-count)" radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
