"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useThemeConfig } from "@/components/active-theme";
import { useOrganizationTheme } from "@/context/organization-theme-context";
import { useChartExport } from "@/hooks/use-chart-export";
import {
  createMultiResponseExcelExportPayload,
  createMultiResponsePowerPointExportPayload,
  exportExcelForDataset,
  exportPowerPointForDataset,
  sanitizeExportBaseName,
} from "@/lib/adhoc-export";
import { resolveSingleSeriesThemeChartColors } from "@/lib/organization-theme";
import { type DatasetVariableWithAttributes } from "@/types/dataset-variable";
import { type StatsResponse } from "@/types/stats";
import { createChartExportMetaLine, resolveChartExportPalette } from "../shared/export-helpers";

type UseMultiResponseAggregateCardExportParams = {
  countedValue: number;
  datasetId: string;
  datasetName: string;
  sortByCountDesc: boolean;
  statsData: Record<string, StatsResponse>;
  variables: DatasetVariableWithAttributes[];
  variablesetName: string;
};

export function useMultiResponseAggregateCardExport({
  countedValue,
  datasetId,
  datasetName,
  sortByCountDesc,
  statsData,
  variables,
  variablesetName,
}: UseMultiResponseAggregateCardExportParams) {
  const t = useTranslations("chartMetricsCard");
  const tAdhoc = useTranslations("projectAdhocAnalysis");
  const locale = useLocale();
  const { activeTheme } = useThemeConfig();
  const { resolveTheme } = useOrganizationTheme();
  const { displayRef, exportRef, isExportRendering, exportPNG } = useChartExport();

  const exportBaseName = useMemo(() => sanitizeExportBaseName(`${variablesetName}-multi-response`), [variablesetName]);
  const exportMetaLine = useMemo(
    () =>
      createChartExportMetaLine({
        datasetName,
        exportedAt: new Date(),
        locale,
        labels: {
          dataset: tAdhoc("export.meta.dataset"),
          exported: tAdhoc("export.meta.exported"),
          split: tAdhoc("export.meta.split"),
        },
      }),
    [datasetName, locale, tAdhoc]
  );

  const resolvedTheme = useMemo(() => resolveTheme(activeTheme).theme, [activeTheme, resolveTheme]);
  const fallbackChartColors = useMemo(() => resolvedTheme.chartColors ?? {}, [resolvedTheme]);
  const chartColors = useMemo(() => resolveSingleSeriesThemeChartColors(resolvedTheme), [resolvedTheme]);

  const getExportPalette = useCallback(
    () => resolveChartExportPalette(displayRef.current, exportRef.current, fallbackChartColors),
    [displayRef, exportRef, fallbackChartColors]
  );

  const handlePowerPointExport = useCallback(async () => {
    try {
      const payload = createMultiResponsePowerPointExportPayload({
        countedValue,
        fileBaseName: exportBaseName,
        metaLine: exportMetaLine,
        palette: getExportPalette(),
        sortByCountDesc,
        statsData,
        title: variablesetName,
        variables,
      });

      await exportPowerPointForDataset(datasetId, payload);
    } catch (error) {
      console.error("Failed to export multi-response PowerPoint", error);
      toast.error(tAdhoc("export.errors.powerpoint"));
    }
  }, [
    countedValue,
    datasetId,
    exportBaseName,
    exportMetaLine,
    getExportPalette,
    sortByCountDesc,
    statsData,
    tAdhoc,
    variables,
    variablesetName,
  ]);

  const handleExcelExport = useCallback(async () => {
    try {
      const payload = createMultiResponseExcelExportPayload({
        countedValue,
        excelLabels: {
          color: tAdhoc("export.excelHeaders.color"),
          label: tAdhoc("export.excelHeaders.label"),
          metric: tAdhoc("export.excelHeaders.metric"),
          value: tAdhoc("export.excelHeaders.value"),
          valuePercent: tAdhoc("export.excelHeaders.valuePercent"),
        },
        fileBaseName: exportBaseName,
        metaLine: exportMetaLine,
        palette: getExportPalette(),
        sortByCountDesc,
        statsData,
        title: variablesetName,
        variables,
      });

      await exportExcelForDataset(datasetId, payload);
    } catch (error) {
      console.error("Failed to export multi-response Excel", error);
      toast.error(tAdhoc("export.errors.excel"));
    }
  }, [
    countedValue,
    datasetId,
    exportBaseName,
    exportMetaLine,
    getExportPalette,
    sortByCountDesc,
    statsData,
    tAdhoc,
    variables,
    variablesetName,
  ]);

  return {
    chartColors,
    displayRef,
    exportBaseName,
    exportPNG,
    exportRef,
    handleExcelExport,
    handlePowerPointExport,
    isExportRendering,
    percentageLabel: t("percent"),
  };
}
