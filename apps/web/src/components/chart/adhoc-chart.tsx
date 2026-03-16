"use client";

import { BanIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useChartExport } from "@/hooks/use-chart-export";
import { hasSplitVariableStatsForVariable } from "@/lib/analysis-bridge";
import { determineChartSelection } from "@/lib/chart-selection";
import { getVariableLabel } from "@/lib/variable-helpers";
import { type DatasetVariableWithAttributes } from "@/types/dataset-variable";
import { type AnalysisChartType, type StatsResponse } from "@/types/stats";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../ui/empty";
import { ChartPanelCard } from "./chart-panel-card";
import {
  BarChartContent,
  HorizontalBarChartContent,
  PieChartContent,
  createPercentageChartConfig,
} from "./chart-shared";
import { HorizontalStackedBarAdhoc } from "./horizontal-stacked-bar-adhoc";
import { MeanBarAdhoc } from "./mean-bar-adhoc";
import { MetricsCards } from "./metrics-cards";
import { TextExplorerAdhoc } from "./text-explorer-adhoc";
import { UnsupportedChartPlaceholder } from "./unsupported-chart-placeholder";
import { useSplitVariableDescription, useSplitVariables } from "./use-split-variables";

type AdhocChartProps = {
  variable: DatasetVariableWithAttributes;
  stats: StatsResponse;
  datasetId?: string;
  selectedSplitVariable?: string | null;
  onSplitVariableChangeAction?: (splitVariable: string | null) => void;
  isMultiResponseIndividual?: boolean;
  countedValue?: number;
} & React.HTMLAttributes<HTMLDivElement>;

function ChartContent({
  chartType,
  variable,
  stats,
  chartRef,
  percentageChartConfig,
  datasetId,
  isMultiResponseIndividual,
  countedValue,
}: {
  chartType: AnalysisChartType;
  variable: DatasetVariableWithAttributes;
  stats: StatsResponse;
  chartRef: React.Ref<HTMLDivElement>;
  percentageChartConfig: ReturnType<typeof createPercentageChartConfig>;
  datasetId?: string;
  isMultiResponseIndividual: boolean;
  countedValue: number;
}) {
  switch (chartType) {
    case "bar":
      return (
        <BarChartContent variable={variable} stats={stats} chartRef={chartRef} chartConfig={percentageChartConfig} />
      );
    case "horizontalBar":
      return (
        <HorizontalBarChartContent
          variable={variable}
          stats={stats}
          chartRef={chartRef}
          chartConfig={percentageChartConfig}
          isMultiResponseIndividual={isMultiResponseIndividual}
          countedValue={countedValue}
        />
      );
    case "horizontalStackedBar":
      return (
        <HorizontalStackedBarAdhoc
          variable={variable}
          stats={stats}
          ref={chartRef}
          isMultiResponseIndividual={isMultiResponseIndividual}
          countedValue={countedValue}
        />
      );
    case "pie":
      return <PieChartContent variable={variable} stats={stats} chartRef={chartRef} />;
    case "metrics":
      return <MetricsCards variable={variable} stats={stats} />;
    case "meanBar":
      return <MeanBarAdhoc variable={variable} stats={stats} ref={chartRef} />;
    case "textExplorer":
      return <TextExplorerAdhoc variable={variable} datasetId={datasetId} />;
    default:
      return null;
  }
}

export function AdhocChart({
  variable,
  stats,
  datasetId,
  selectedSplitVariable,
  onSplitVariableChangeAction,
  isMultiResponseIndividual = false,
  countedValue = 1,
  ...props
}: AdhocChartProps) {
  const t = useTranslations("projectAdhocAnalysis");
  const tChart = useTranslations("chartMetricsCard");
  const { ref, exportPNG } = useChartExport();
  const [chartSelectionState, setChartSelectionState] = useState<Record<string, AnalysisChartType | null>>({});

  const hasSplitVariable = useMemo(
    () => hasSplitVariableStatsForVariable(stats, variable.name),
    [stats, variable.name]
  );

  const chartSelection = useMemo(
    () =>
      determineChartSelection({
        variable,
        stats,
        hasSplitVariable,
        attributes: variable.attributes,
        isMultiResponseIndividual,
      }),
    [hasSplitVariable, isMultiResponseIndividual, stats, variable]
  );

  const percentageChartConfig = useMemo(
    () => createPercentageChartConfig({ percentLabel: tChart("percent") }),
    [tChart]
  );

  const chartStateKey = `${variable.id}-${hasSplitVariable}`;
  const actualSelectedChartType = chartSelectionState[chartStateKey] ?? chartSelection.defaultChartType;
  const shouldLoadSplitVariables = Boolean(datasetId) && (chartSelection.canUseSplitVariable || hasSplitVariable);
  const { splitVariables, isLoading: isSplitVariablesLoading } = useSplitVariables(datasetId, shouldLoadSplitVariables);
  const splitVariableDescription = useSplitVariableDescription(variable, stats, splitVariables);

  if (chartSelection.showUnsupportedPlaceholder) {
    return (
      <UnsupportedChartPlaceholder
        variableName={variable.name}
        variableLabel={getVariableLabel(variable)}
        reason={chartSelection.unsupportedReason}
        data-testid="unsupported-chart-placeholder"
        {...props}
      />
    );
  }

  if (chartSelection.availableChartTypes.length === 0) {
    return (
      <div {...props}>
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle>{getVariableLabel(variable)}</CardTitle>
            {splitVariableDescription && <CardDescription>{splitVariableDescription}</CardDescription>}
          </CardHeader>
          <CardContent>
            <Empty className="border-none p-8">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BanIcon />
                </EmptyMedia>
                <EmptyTitle>{t("noChartsAllowed.title")}</EmptyTitle>
                <EmptyDescription>{t("noChartsAllowed.description")}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent></EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div {...props}>
      <ChartPanelCard
        variable={variable}
        stats={stats}
        description={splitVariableDescription}
        chartContent={
          <ChartContent
            chartType={actualSelectedChartType}
            variable={variable}
            stats={stats}
            chartRef={ref}
            percentageChartConfig={percentageChartConfig}
            datasetId={datasetId}
            isMultiResponseIndividual={isMultiResponseIndividual}
            countedValue={countedValue}
          />
        }
        exportable={actualSelectedChartType !== "textExplorer"}
        onExport={exportPNG}
        availableChartTypes={chartSelection.availableChartTypes}
        selectedChartType={actualSelectedChartType}
        onChartTypeChange={(chartType) =>
          setChartSelectionState((prev) => ({
            ...prev,
            [chartStateKey]: chartType,
          }))
        }
        selectedSplitVariable={selectedSplitVariable}
        onSplitVariableChangeAction={onSplitVariableChangeAction}
        canUseSplitVariable={chartSelection.canUseSplitVariable}
        datasetId={datasetId}
        isMultiResponseIndividual={isMultiResponseIndividual}
        splitVariables={splitVariables}
        isSplitVariablesLoading={isSplitVariablesLoading}
      />
    </div>
  );
}
