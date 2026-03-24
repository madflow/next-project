"use client";

import { BanIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useThemeConfig } from "@/components/active-theme";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrganizationTheme } from "@/context/organization-theme-context";
import { useChartExport } from "@/hooks/use-chart-export";
import {
  buildExportMetaLine,
  createVariableChartExcelExportPayload,
  createVariableChartPowerPointExportPayload,
  exportExcelForDataset,
  exportPowerPointForDataset,
  getComputedExportPalette,
  sanitizeExportBaseName,
} from "@/lib/adhoc-export";
import { hasSplitVariableStatsForVariable } from "@/lib/analysis-bridge";
import { determineChartSelection } from "@/lib/chart-selection";
import { getVariableLabel } from "@/lib/variable-helpers";
import { type DatasetVariableWithAttributes } from "@/types/dataset-variable";
import { type AnalysisChartType, type StatsResponse } from "@/types/stats";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../ui/empty";
import { ChartExportSurface } from "./chart-export-surface";
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
import { getSplitVariableLabel, useSplitVariableDescription, useSplitVariables } from "./use-split-variables";

type AdhocChartProps = {
  variable: DatasetVariableWithAttributes;
  stats: StatsResponse;
  datasetId?: string;
  datasetName?: string;
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
  chartRef?: React.Ref<HTMLDivElement>;
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
  datasetName,
  selectedSplitVariable,
  onSplitVariableChangeAction,
  isMultiResponseIndividual = false,
  countedValue = 1,
  ...props
}: AdhocChartProps) {
  const t = useTranslations("projectAdhocAnalysis");
  const locale = useLocale();
  const tChart = useTranslations("chartMetricsCard");
  const { activeTheme } = useThemeConfig();
  const { resolveTheme } = useOrganizationTheme();
  const { displayRef, exportRef, isExportRendering, exportPNG } = useChartExport();
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
  const splitVariableLabel = useMemo(
    () => getSplitVariableLabel(variable, stats, splitVariables),
    [splitVariables, stats, variable]
  );
  const exportMetaLine = useMemo(
    () =>
      buildExportMetaLine({
        datasetName: datasetName || datasetId || "",
        exportedAtLabel: new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date()),
        labels: {
          dataset: t("export.meta.dataset"),
          exported: t("export.meta.exported"),
          split: t("export.meta.split"),
        },
        splitLabel: splitVariableLabel,
      }),
    [datasetId, datasetName, locale, splitVariableLabel, t]
  );
  const fallbackChartColors = useMemo(() => resolveTheme(activeTheme).theme.chartColors, [activeTheme, resolveTheme]);
  const exportBaseName = useMemo(() => sanitizeExportBaseName(variable.name), [variable.name]);

  const handlePowerPointExport = useCallback(async () => {
    if (!datasetId || actualSelectedChartType === "textExplorer") {
      return;
    }

    try {
      const palette = getComputedExportPalette(displayRef.current ?? exportRef.current, fallbackChartColors);

      const payload = createVariableChartPowerPointExportPayload({
        chartType: actualSelectedChartType,
        countedValue,
        fileBaseName: exportBaseName,
        isMultiResponseIndividual,
        metaLine: exportMetaLine,
        metricsLabels: {
          count: tChart("count"),
          max: tChart("max"),
          mean: tChart("mean"),
          median: tChart("median"),
          min: tChart("min"),
          stdev: tChart("stdev"),
        },
        palette,
        stats,
        variable,
      });

      await exportPowerPointForDataset(datasetId, payload);
    } catch (error) {
      console.error("Failed to export PowerPoint", error);
      toast.error(t("export.errors.powerpoint"));
    }
  }, [
    actualSelectedChartType,
    countedValue,
    datasetId,
    displayRef,
    exportBaseName,
    exportRef,
    exportMetaLine,
    fallbackChartColors,
    isMultiResponseIndividual,
    stats,
    t,
    tChart,
    variable,
  ]);

  const handleExcelExport = useCallback(async () => {
    if (!datasetId || actualSelectedChartType === "textExplorer") {
      return;
    }

    try {
      const palette = getComputedExportPalette(displayRef.current ?? exportRef.current, fallbackChartColors);

      const payload = createVariableChartExcelExportPayload({
        chartType: actualSelectedChartType,
        countedValue,
        excelLabels: {
          color: t("export.excelHeaders.color"),
          label: t("export.excelHeaders.label"),
          metric: t("export.excelHeaders.metric"),
          value: t("export.excelHeaders.value"),
          valuePercent: t("export.excelHeaders.valuePercent"),
        },
        fileBaseName: exportBaseName,
        isMultiResponseIndividual,
        metaLine: exportMetaLine,
        metricsLabels: {
          count: tChart("count"),
          max: tChart("max"),
          mean: tChart("mean"),
          median: tChart("median"),
          min: tChart("min"),
          stdev: tChart("stdev"),
        },
        palette,
        stats,
        variable,
      });

      await exportExcelForDataset(datasetId, payload);
    } catch (error) {
      console.error("Failed to export Excel", error);
      toast.error(t("export.errors.excel"));
    }
  }, [
    actualSelectedChartType,
    countedValue,
    datasetId,
    displayRef,
    exportBaseName,
    exportRef,
    exportMetaLine,
    fallbackChartColors,
    isMultiResponseIndividual,
    stats,
    t,
    tChart,
    variable,
  ]);

  const chartContent = (
    <ChartContent
      chartType={actualSelectedChartType}
      variable={variable}
      stats={stats}
      chartRef={displayRef}
      percentageChartConfig={percentageChartConfig}
      datasetId={datasetId}
      isMultiResponseIndividual={isMultiResponseIndividual}
      countedValue={countedValue}
    />
  );

  const exportChartContent = (
    <ChartContent
      chartType={actualSelectedChartType}
      variable={variable}
      stats={stats}
      percentageChartConfig={percentageChartConfig}
      datasetId={datasetId}
      isMultiResponseIndividual={isMultiResponseIndividual}
      countedValue={countedValue}
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
      <ChartExportSurface exportRef={exportRef} fileName={exportBaseName} isRendering={isExportRendering}>
        {exportChartContent}
      </ChartExportSurface>
      <ChartPanelCard
        variable={variable}
        stats={stats}
        description={splitVariableDescription}
        chartContent={chartContent}
        exportable={actualSelectedChartType !== "textExplorer"}
        onExportImage={exportPNG}
        onExportExcel={handleExcelExport}
        onExportPowerPoint={handlePowerPointExport}
        exportDisabled={!datasetId}
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
