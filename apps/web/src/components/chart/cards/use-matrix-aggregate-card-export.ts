"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useThemeConfig } from "@/components/active-theme";
import { useOrganizationTheme } from "@/context/organization-theme-context";
import { useChartExport } from "@/hooks/use-chart-export";
import {
  createMatrixExcelExportPayload,
  createMatrixPowerPointExportPayload,
  exportExcelForDataset,
  exportPowerPointForDataset,
  sanitizeExportBaseName,
} from "@/lib/adhoc-export";
import { resolveThemePaletteForCount } from "@/lib/organization-theme";
import type { DatasetVariableWithAttributes } from "@/types/dataset-variable";
import type { StatsResponse } from "@/types/stats";
import { createChartExportMetaLine, resolveChartExportPalette } from "../shared/export-helpers";

type UseMatrixAggregateCardExportParams = {
  datasetId: string;
  datasetName: string;
  segmentCount: number;
  statsData: Record<string, StatsResponse>;
  variables: DatasetVariableWithAttributes[];
  variablesetName: string;
};

export function useMatrixAggregateCardExport({
  datasetId,
  datasetName,
  segmentCount,
  statsData,
  variables,
  variablesetName,
}: UseMatrixAggregateCardExportParams) {
  const tAdhoc = useTranslations("projectAdhocAnalysis");
  const locale = useLocale();
  const { activeTheme } = useThemeConfig();
  const { resolveTheme } = useOrganizationTheme();
  const { displayRef, exportRef, isExportRendering, exportPNG } = useChartExport();
  const exportBaseName = useMemo(() => sanitizeExportBaseName(`${variablesetName}-matrix`), [variablesetName]);
  const resolvedTheme = useMemo(() => resolveTheme(activeTheme).theme, [activeTheme, resolveTheme]);
  const chartColors = useMemo(
    () => resolveThemePaletteForCount(resolvedTheme, segmentCount),
    [resolvedTheme, segmentCount]
  );

  const createExportMetaLine = useCallback(
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
  const getExportPalette = useCallback(
    () => resolveChartExportPalette(displayRef.current, exportRef.current, chartColors),
    [displayRef, exportRef, chartColors]
  );

  const handlePowerPointExport = useCallback(async () => {
    try {
      const payload = createMatrixPowerPointExportPayload({
        fileBaseName: exportBaseName,
        metaLine: createExportMetaLine(),
        palette: getExportPalette(),
        statsData,
        title: variablesetName,
        variables,
      });

      await exportPowerPointForDataset(datasetId, payload);
    } catch (error) {
      console.error("Failed to export matrix PowerPoint", error);
      toast.error(tAdhoc("export.errors.powerpoint"));
    }
  }, [
    createExportMetaLine,
    datasetId,
    exportBaseName,
    getExportPalette,
    statsData,
    tAdhoc,
    variables,
    variablesetName,
  ]);

  const handleExcelExport = useCallback(async () => {
    try {
      const payload = createMatrixExcelExportPayload({
        excelLabels: {
          color: tAdhoc("export.excelHeaders.color"),
          label: tAdhoc("export.excelHeaders.label"),
          metric: tAdhoc("export.excelHeaders.metric"),
          value: tAdhoc("export.excelHeaders.value"),
          valuePercent: tAdhoc("export.excelHeaders.valuePercent"),
        },
        fileBaseName: exportBaseName,
        metaLine: createExportMetaLine(),
        palette: getExportPalette(),
        statsData,
        title: variablesetName,
        variables,
      });

      await exportExcelForDataset(datasetId, payload);
    } catch (error) {
      console.error("Failed to export matrix Excel", error);
      toast.error(tAdhoc("export.errors.excel"));
    }
  }, [
    createExportMetaLine,
    datasetId,
    exportBaseName,
    getExportPalette,
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
  };
}
