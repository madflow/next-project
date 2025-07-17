"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { transformToRechartsData } from "@/lib/analysis-bridge";
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
    <Card>
      <CardHeader>
        <CardTitle>{variable.label}</CardTitle>
        {/* <CardDescription>January - June 2024</CardDescription> */}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={transformToRechartsData(variable, stats)}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} tickMargin={10} axisLine={false} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium"></div>
        <div className="text-muted-foreground leading-none"></div>
      </CardFooter>
    </Card>
  );
}
