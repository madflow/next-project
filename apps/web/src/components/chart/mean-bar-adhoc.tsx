"use client";

import { DownloadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, LabelList } from "recharts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useChartExport } from "@/hooks/use-chart-export";
import { useQueryApi } from "@/hooks/use-query-api";
import { extractVariableStats, isSplitVariableStats } from "@/lib/analysis-bridge";
import { type DatasetVariable } from "@/types/dataset-variable";
import { StatsResponse } from "@/types/stats";
import { Button } from "../ui/button";

type MeanBarAdhocProps = {
  variable: DatasetVariable;
  stats: StatsResponse;
  datasetId?: string;
  renderAsContent?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

export function MeanBarAdhoc({ variable, stats, datasetId, renderAsContent, ...props }: MeanBarAdhocProps) {
  const t = useTranslations("chartMetricsCard");
  const { ref, exportPNG } = useChartExport();

  // Fetch split variables when datasetId is provided
  const { data: splitVariablesResponse } = useQueryApi<{ rows: DatasetVariable[] }>({
    endpoint: `/api/datasets/${datasetId}/splitvariables`,
    pagination: { pageIndex: 0, pageSize: 100 },
    sorting: [],
    search: "",
    queryKey: ["dataset-split-variables", datasetId],
    enabled: !!datasetId,
  });

  const allVariables = splitVariablesResponse?.rows || [];

  // Helper function to get split variable description
  function getSplitVariableDescription(variable: DatasetVariable, stats: StatsResponse): string | null {
    // Find the stats for this variable
    const targetVariable = stats.find((item) => item.variable === variable.name);
    if (!targetVariable || !isSplitVariableStats(targetVariable.stats)) {
      return null;
    }

    const splitVariableName = targetVariable.stats.split_variable;

    // Try to find the split variable in allVariables to get its label
    if (allVariables.length > 0) {
      const splitVariable = allVariables.find((v: DatasetVariable) => v.name === splitVariableName);
      if (splitVariable) {
        const splitVariableLabel = splitVariable.label ?? splitVariable.name;
        return `Split by ${splitVariableLabel}`;
      }
    }

    // Fallback to variable name if no label found
    return `Split by ${splitVariableName}`;
  }

  // Find the stats for this variable using the helper function
  const variableStats = extractVariableStats(variable, stats);
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
        <Bar dataKey="value" fill="var(--color-value)">
          <LabelList dataKey="value" position="right" formatter={(value: number) => `${Math.round(value * 100) / 100}`} />
        </Bar>
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
        {getSplitVariableDescription(variable, stats) && (
          <CardDescription>{getSplitVariableDescription(variable, stats)}</CardDescription>
        )}
      </CardHeader>
      <CardContent>{chartContent}</CardContent>

      <CardFooter>
        <Button className="cursor-pointer" variant="outline" onClick={exportPNG}>
          <DownloadIcon className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
