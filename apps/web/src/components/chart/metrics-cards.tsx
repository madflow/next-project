"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQueryApi } from "@/hooks/use-query-api";
import { getVariableStats, isSplitVariableStats } from "@/lib/analysis-bridge";
import { type DatasetVariable } from "@/types/dataset-variable";
import { StatsResponse } from "@/types/stats";

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
          <CardDescription>{t("count")}</CardDescription>
          <CardTitle>{variableStats?.count}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>{t("mean")}</CardDescription>
          <CardTitle>{formatDecimal(variableStats?.mean)}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>{t("stdev")}</CardDescription>
          <CardTitle>{formatDecimal(variableStats?.std)}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>{t("median")}</CardDescription>
          <CardTitle>{variableStats?.median}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>{t("min")}</CardDescription>
          <CardTitle>{variableStats?.min}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>{t("max")}</CardDescription>
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
