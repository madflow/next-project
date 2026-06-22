"use client";

import { BanIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getVariableLabel } from "@/lib/variable-helpers";
import { type DatasetVariableWithAttributes } from "@/types/dataset-variable";
import { type StatsResponse } from "@/types/stats";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../../ui/empty";
import { ChartRendererContent } from "../renderers/content";
import { ChartExportSurface } from "../shared/export-surface";
import { ChartPanelCard } from "../shared/panel-card";
import { createPercentageChartConfig } from "../shared/percentage-chart-config";
import { UnsupportedChartPlaceholder } from "../shared/unsupported-placeholder";
import { useVariableChartCardController } from "./use-variable-chart-card-controller";

type VariableChartCardProps = {
  variable: DatasetVariableWithAttributes;
  stats: StatsResponse;
  datasetId?: string;
  datasetName?: string;
  selectedSplitVariable?: string | null;
  onSplitVariableChangeAction?: (splitVariable: string | null) => void;
  isMultiResponseIndividual?: boolean;
  countedValue?: number;
} & React.HTMLAttributes<HTMLDivElement>;

export function VariableChartCard({
  variable,
  stats,
  datasetId,
  datasetName,
  selectedSplitVariable,
  onSplitVariableChangeAction,
  isMultiResponseIndividual = false,
  countedValue = 1,
  ...props
}: VariableChartCardProps) {
  const t = useTranslations("projectAdhocAnalysis");
  const tChart = useTranslations("chartMetricsCard");

  const percentageChartConfig = useMemo(
    () => createPercentageChartConfig({ percentLabel: tChart("percent") }),
    [tChart]
  );
  const {
    chartSelection,
    selectedChartType,
    handleChartTypeChange,
    sortByCountDesc,
    chartSortConfig,
    handleSortByCountDescChange,
    splitVariables,
    isSplitVariablesLoading,
    splitVariableDescription,
    exportBaseName,
    chartColors,
    displayRef,
    exportRef,
    isExportRendering,
    exportPNG,
    handleExcelExport,
    handlePowerPointExport,
  } = useVariableChartCardController({
    variable,
    stats,
    datasetId,
    datasetName,
    isMultiResponseIndividual,
    countedValue,
  });

  const chartContent = (
    <ChartRendererContent
      chartType={selectedChartType}
      variable={variable}
      stats={stats}
      chartRef={displayRef}
      percentageChartConfig={percentageChartConfig}
      chartColors={chartColors}
      datasetId={datasetId}
      isMultiResponseIndividual={isMultiResponseIndividual}
      countedValue={countedValue}
      sortConfig={chartSortConfig}
    />
  );

  const exportable = selectedChartType !== "textExplorer";

  const exportChartContent = (
    <ChartRendererContent
      chartType={selectedChartType}
      variable={variable}
      stats={stats}
      percentageChartConfig={percentageChartConfig}
      chartColors={chartColors}
      datasetId={datasetId}
      isMultiResponseIndividual={isMultiResponseIndividual}
      countedValue={countedValue}
      disableAnimation
      sortConfig={chartSortConfig}
    />
  );

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
      {exportable && (
        <ChartExportSurface exportRef={exportRef} fileName={exportBaseName} isRendering={isExportRendering}>
          {exportChartContent}
        </ChartExportSurface>
      )}
      <ChartPanelCard
        variable={variable}
        stats={stats}
        description={splitVariableDescription}
        chartContent={chartContent}
        exportable={exportable}
        onExportImageAction={exportPNG}
        onExportExcelAction={handleExcelExport}
        onExportPowerPointAction={handlePowerPointExport}
        exportDisabled={!datasetId}
        availableChartTypes={chartSelection.availableChartTypes}
        selectedChartType={selectedChartType}
        onChartTypeChangeAction={handleChartTypeChange}
        selectedSplitVariable={selectedSplitVariable}
        onSplitVariableChangeAction={onSplitVariableChangeAction}
        canUseSplitVariable={chartSelection.canUseSplitVariable}
        datasetId={datasetId}
        isMultiResponseIndividual={isMultiResponseIndividual}
        splitVariables={splitVariables}
        isSplitVariablesLoading={isSplitVariablesLoading}
        sortByCountDesc={sortByCountDesc}
        onSortByCountDescChangeAction={handleSortByCountDescChange}
      />
    </div>
  );
}
