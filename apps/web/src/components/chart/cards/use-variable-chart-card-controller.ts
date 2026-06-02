"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useThemeConfig } from "@/components/active-theme";
import { useOrganizationTheme } from "@/context/organization-theme-context";
import { useChartExport } from "@/hooks/use-chart-export";
import {
  createVariableChartExcelExportPayload,
  createVariableChartPowerPointExportPayload,
  exportExcelForDataset,
  exportPowerPointForDataset,
  sanitizeExportBaseName,
} from "@/lib/adhoc-export";
import {
  type ChartSortConfig,
  getStackedBarSegmentCount,
  hasSplitVariableStatsForVariable,
  transformToRechartsPieData,
} from "@/lib/analysis-bridge";
import { determineChartSelection } from "@/lib/chart-selection";
import { resolveSingleSeriesThemeChartColors, resolveThemePaletteForCount } from "@/lib/organization-theme";
import { type DatasetVariableWithAttributes } from "@/types/dataset-variable";
import { type AnalysisChartType, type StatsResponse } from "@/types/stats";
import { createChartExportMetaLine, resolveChartExportPalette } from "../shared/export-helpers";
import { getSplitVariableLabel, useSplitVariableDescription } from "../split-variable/helpers";
import { useSplitVariables } from "../split-variable/use-split-variables";

type UseVariableChartCardControllerParams = {
  variable: DatasetVariableWithAttributes;
  stats: StatsResponse;
  datasetId?: string;
  datasetName?: string;
  isMultiResponseIndividual?: boolean;
  countedValue?: number;
};

export function useVariableChartCardController({
  variable,
  stats,
  datasetId,
  datasetName,
  isMultiResponseIndividual = false,
  countedValue = 1,
}: UseVariableChartCardControllerParams) {
  const t = useTranslations("projectAdhocAnalysis");
  const locale = useLocale();
  const tChart = useTranslations("chartMetricsCard");
  const { activeTheme } = useThemeConfig();
  const { resolveTheme } = useOrganizationTheme();
  const { displayRef, exportRef, isExportRendering, exportPNG } = useChartExport();
  const [chartSelectionState, setChartSelectionState] = useState<Record<string, AnalysisChartType | null>>({});
  const [sortByCountDescState, setSortByCountDescState] = useState<Record<string, boolean>>({});

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

  const chartStateKey = `${variable.id}-${hasSplitVariable}`;
  const selectedChartType = chartSelectionState[chartStateKey] ?? chartSelection.defaultChartType;
  const sortByCountDesc = sortByCountDescState[chartStateKey] ?? false;
  const chartSortConfig: ChartSortConfig | undefined = sortByCountDesc
    ? { field: "counts", direction: "desc" }
    : undefined;

  const handleChartTypeChange = useCallback(
    (chartType: AnalysisChartType) => {
      setChartSelectionState((prev) => ({
        ...prev,
        [chartStateKey]: chartType,
      }));
    },
    [chartStateKey]
  );

  const handleSortByCountDescChange = useCallback(
    (value: boolean) => {
      setSortByCountDescState((prev) => ({
        ...prev,
        [chartStateKey]: value,
      }));
    },
    [chartStateKey]
  );

  const shouldLoadSplitVariables = Boolean(datasetId) && (chartSelection.canUseSplitVariable || hasSplitVariable);
  const { splitVariables, isLoading: isSplitVariablesLoading } = useSplitVariables(datasetId, shouldLoadSplitVariables);
  const splitVariableDescription = useSplitVariableDescription(variable, stats, splitVariables);
  const splitVariableLabel = useMemo(
    () => getSplitVariableLabel(variable, stats, splitVariables),
    [splitVariables, stats, variable]
  );

  const exportMetaLine = useMemo(
    () =>
      createChartExportMetaLine({
        datasetId,
        datasetName,
        exportedAt: new Date(),
        locale,
        splitLabel: splitVariableLabel,
        labels: {
          dataset: t("export.meta.dataset"),
          exported: t("export.meta.exported"),
          split: t("export.meta.split"),
        },
      }),
    [datasetId, datasetName, locale, splitVariableLabel, t]
  );

  const resolvedTheme = useMemo(() => resolveTheme(activeTheme).theme, [activeTheme, resolveTheme]);
  const exportBaseName = useMemo(() => sanitizeExportBaseName(variable.name), [variable.name]);
  const chartColors = useMemo(() => {
    switch (selectedChartType) {
      case "bar":
      case "horizontalBar":
      case "meanBar":
        return resolveSingleSeriesThemeChartColors(resolvedTheme);
      case "pie": {
        const categoryCount = Math.max(1, Math.min(6, transformToRechartsPieData(variable, stats).length));
        return resolveThemePaletteForCount(resolvedTheme, categoryCount);
      }
      case "horizontalStackedBar": {
        const segmentCount = Math.max(1, Math.min(6, getStackedBarSegmentCount(variable, stats)));
        return resolveThemePaletteForCount(resolvedTheme, segmentCount);
      }
      default:
        return undefined;
    }
  }, [selectedChartType, resolvedTheme, stats, variable]);
  const fallbackChartColors = useMemo(
    () => chartColors ?? resolvedTheme.chartColors ?? {},
    [chartColors, resolvedTheme]
  );

  const getExportPalette = useCallback(
    () => resolveChartExportPalette(displayRef.current, exportRef.current, fallbackChartColors),
    [displayRef, exportRef, fallbackChartColors]
  );

  const metricLabels = useMemo(
    () => ({
      count: tChart("count"),
      max: tChart("max"),
      mean: tChart("mean"),
      median: tChart("median"),
      min: tChart("min"),
      stdev: tChart("stdev"),
    }),
    [tChart]
  );

  const handlePowerPointExport = useCallback(async () => {
    if (!datasetId || selectedChartType === "textExplorer") {
      return;
    }

    try {
      const payload = createVariableChartPowerPointExportPayload({
        chartType: selectedChartType,
        countedValue,
        fileBaseName: exportBaseName,
        isMultiResponseIndividual,
        metaLine: exportMetaLine,
        metricsLabels: metricLabels,
        palette: getExportPalette(),
        sortByCountDesc,
        stats,
        variable,
      });

      await exportPowerPointForDataset(datasetId, payload);
    } catch (error) {
      console.error("Failed to export PowerPoint", error);
      toast.error(t("export.errors.powerpoint"));
    }
  }, [
    countedValue,
    datasetId,
    exportBaseName,
    exportMetaLine,
    getExportPalette,
    isMultiResponseIndividual,
    metricLabels,
    selectedChartType,
    sortByCountDesc,
    stats,
    t,
    variable,
  ]);

  const handleExcelExport = useCallback(async () => {
    if (!datasetId || selectedChartType === "textExplorer") {
      return;
    }

    try {
      const payload = createVariableChartExcelExportPayload({
        chartType: selectedChartType,
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
        metricsLabels: metricLabels,
        palette: getExportPalette(),
        sortByCountDesc,
        stats,
        variable,
      });

      await exportExcelForDataset(datasetId, payload);
    } catch (error) {
      console.error("Failed to export Excel", error);
      toast.error(t("export.errors.excel"));
    }
  }, [
    countedValue,
    datasetId,
    exportBaseName,
    exportMetaLine,
    getExportPalette,
    isMultiResponseIndividual,
    metricLabels,
    selectedChartType,
    sortByCountDesc,
    stats,
    t,
    variable,
  ]);

  return {
    chartSelection,
    selectedChartType,
    handleChartTypeChange,
    sortByCountDesc,
    chartSortConfig,
    handleSortByCountDescChange,
    splitVariables,
    isSplitVariablesLoading,
    splitVariableDescription,
    exportMetaLine,
    exportBaseName,
    chartColors,
    displayRef,
    exportRef,
    isExportRendering,
    exportPNG,
    handleExcelExport,
    handlePowerPointExport,
  };
}
