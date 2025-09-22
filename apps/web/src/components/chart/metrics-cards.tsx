"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQueryApi } from "@/hooks/use-query-api";
import { getVariableStats, isSplitVariableStats } from "@/lib/analysis-bridge";
import { type DatasetVariable } from "@/types/dataset-variable";
import { StatsResponse } from "@/types/stats";
import { CircleHelp } from "lucide-react";

type BarAdhocProps = {
  variable: DatasetVariable;
  stats: StatsResponse;
  datasetId?: string;
  renderAsContent?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

function formatDecimal(value?: number) {
  if (!value) return "";
  return new Intl.NumberFormat("de-DE", { style: "decimal" }).format(value);
}

function MetricHelp({ metricKey, children }: { metricKey: "count" | "mean" | "median" | "stdev" | "min" | "max"; children: React.ReactNode }) {
  const tHelp = useTranslations("metricsHelp");
  
  return (
    <div className="flex items-center gap-1">
      {children}
      <Popover>
        <PopoverTrigger asChild>
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <CircleHelp className="h-3 w-3" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-2">
            <h4 className="font-medium">{tHelp(`${metricKey}.title`)}</h4>
            <p className="text-sm text-muted-foreground">{tHelp(`${metricKey}.description`)}</p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function MetricsCards({ variable, stats, datasetId, renderAsContent, ...props }: BarAdhocProps) {
  const t = useTranslations("chartMetricsCard");
  const variableStats = getVariableStats(variable, stats);

  // Fetch split variables when datasetId is provided
  const { data: splitVariablesResponse } = useQueryApi<{rows: DatasetVariable[]}>({
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

  const content = (
    <div className="grid grid-cols-3 gap-2">
      <Card>
        <CardHeader>
          <MetricHelp metricKey="count">
            <CardDescription>{t("count")}</CardDescription>
          </MetricHelp>
          <CardTitle>{variableStats?.count}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <MetricHelp metricKey="mean">
            <CardDescription>{t("mean")}</CardDescription>
          </MetricHelp>
          <CardTitle>{formatDecimal(variableStats?.mean)}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <MetricHelp metricKey="stdev">
            <CardDescription>{t("stdev")}</CardDescription>
          </MetricHelp>
          <CardTitle>{formatDecimal(variableStats?.std)}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <MetricHelp metricKey="median">
            <CardDescription>{t("median")}</CardDescription>
          </MetricHelp>
          <CardTitle>{variableStats?.median}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <MetricHelp metricKey="min">
            <CardDescription>{t("min")}</CardDescription>
          </MetricHelp>
          <CardTitle>{variableStats?.min}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <MetricHelp metricKey="max">
            <CardDescription>{t("max")}</CardDescription>
          </MetricHelp>
          <CardTitle>{variableStats?.max}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );

  if (renderAsContent) {
    return content;
  }

  return (
    <Card className="shadow-xs" {...props}>
      <CardHeader>
        <CardTitle>{variable.label ?? variable.name}</CardTitle>
        {getSplitVariableDescription(variable, stats) && (
          <CardDescription>{getSplitVariableDescription(variable, stats)}</CardDescription>
        )}
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
