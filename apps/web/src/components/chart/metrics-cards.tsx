"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getVariableStats } from "@/lib/analysis-bridge";
import { type DatasetVariable } from "@/types/dataset-variable";
import { StatsResponse } from "@/types/stats";

type BarAdhocProps = {
  variable: DatasetVariable;
  stats: StatsResponse;
} & React.HTMLAttributes<HTMLDivElement>;

function formatDecimal(value?: number) {
  if (!value) return "";
  return new Intl.NumberFormat("de-DE", { style: "decimal" }).format(value);
}

export function MetricsCards({ variable, stats, ...props }: BarAdhocProps) {
  const t = useTranslations("chartMetricsCard");
  const variableStats = getVariableStats(variable, stats);
  return (
    <Card className="shadow-xs" {...props}>
      <CardHeader>
        <CardTitle>{variable.label ?? variable.name}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-2">
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
      </CardContent>
    </Card>
  );
}
