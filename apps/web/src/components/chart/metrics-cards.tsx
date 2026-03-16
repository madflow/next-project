"use client";

import { CircleHelp } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getVariableStats } from "@/lib/analysis-bridge";
import { METRICS_CARD_DECIMALS, formatChartValue } from "@/lib/chart-constants";
import { type DatasetVariableWithAttributes } from "@/types/dataset-variable";
import { type StatsResponse } from "@/types/stats";

type MetricsCardsProps = {
  variable: DatasetVariableWithAttributes;
  stats: StatsResponse;
};

function formatDecimal(value?: number) {
  if (value === null || value === undefined) {
    return "";
  }

  return formatChartValue(value, METRICS_CARD_DECIMALS);
}

function MetricHelp({
  metricKey,
  children,
}: {
  metricKey: "count" | "mean" | "median" | "stdev" | "min" | "max";
  children: React.ReactNode;
}) {
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
            <p className="text-muted-foreground text-sm">{tHelp(`${metricKey}.description`)}</p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function MetricsCards({ variable, stats }: MetricsCardsProps) {
  const t = useTranslations("chartMetricsCard");
  const variableStats = getVariableStats(variable, stats);

  return (
    <div className="grid grid-cols-3 gap-2">
      <Card className="shadow-xs">
        <CardHeader>
          <MetricHelp metricKey="count">
            <CardDescription>{t("count")}</CardDescription>
          </MetricHelp>
          <CardTitle>{variableStats?.count}</CardTitle>
        </CardHeader>
      </Card>
      <Card className="shadow-xs">
        <CardHeader>
          <MetricHelp metricKey="mean">
            <CardDescription>{t("mean")}</CardDescription>
          </MetricHelp>
          <CardTitle>{formatDecimal(variableStats?.mean)}</CardTitle>
        </CardHeader>
      </Card>
      <Card className="shadow-xs">
        <CardHeader>
          <MetricHelp metricKey="stdev">
            <CardDescription>{t("stdev")}</CardDescription>
          </MetricHelp>
          <CardTitle>{formatDecimal(variableStats?.std)}</CardTitle>
        </CardHeader>
      </Card>
      <Card className="shadow-xs">
        <CardHeader>
          <MetricHelp metricKey="median">
            <CardDescription>{t("median")}</CardDescription>
          </MetricHelp>
          <CardTitle>{variableStats?.median}</CardTitle>
        </CardHeader>
      </Card>
      <Card className="shadow-xs">
        <CardHeader>
          <MetricHelp metricKey="min">
            <CardDescription>{t("min")}</CardDescription>
          </MetricHelp>
          <CardTitle>{variableStats?.min}</CardTitle>
        </CardHeader>
      </Card>
      <Card className="shadow-xs">
        <CardHeader>
          <MetricHelp metricKey="max">
            <CardDescription>{t("max")}</CardDescription>
          </MetricHelp>
          <CardTitle>{variableStats?.max}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
