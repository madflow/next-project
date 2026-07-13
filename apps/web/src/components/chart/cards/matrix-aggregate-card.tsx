"use client";

import { useMemo } from "react";
import { transformToMatrixData } from "@/lib/analysis-bridge";
import type { DatasetVariableWithAttributes } from "@/types/dataset-variable";
import type { StatsResponse } from "@/types/stats";
import { createSplitHorizontalStackedBarModel } from "../renderers/horizontal-stacked-bar/model";
import { HorizontalStackedBarChart } from "../renderers/horizontal-stacked-bar/renderer";
import { ChartExportSurface } from "../shared/export-surface";
import { ChartPanelCard } from "../shared/panel-card";
import { useMatrixAggregateCardExport } from "./use-matrix-aggregate-card-export";

type MatrixAggregateCardProps = {
  variables: DatasetVariableWithAttributes[];
  statsData: Record<string, StatsResponse>;
  variablesetName: string;
  variablesetDescription?: string | null;
  datasetId: string;
  datasetName: string;
} & React.HTMLAttributes<HTMLDivElement>;

export function MatrixAggregateCard({
  variables,
  statsData,
  variablesetName,
  variablesetDescription,
  datasetId,
  datasetName,
  ...props
}: MatrixAggregateCardProps) {
  const model = useMemo(
    () => createSplitHorizontalStackedBarModel(transformToMatrixData(variables, statsData)),
    [statsData, variables]
  );
  const {
    chartColors,
    displayRef,
    exportBaseName,
    exportPNG,
    exportRef,
    handleExcelExport,
    handlePowerPointExport,
    isExportRendering,
  } = useMatrixAggregateCardExport({ datasetId, datasetName, statsData, variables, variablesetName });

  const chartContent = (
    <HorizontalStackedBarChart
      model={model}
      chartColors={chartColors}
      chartRef={displayRef}
      exportFilename={exportBaseName}
    />
  );

  return (
    <div data-testid="matrix-chart" {...props}>
      <ChartExportSurface exportRef={exportRef} fileName={exportBaseName} isRendering={isExportRendering}>
        <HorizontalStackedBarChart
          model={model}
          chartColors={chartColors}
          exportFilename={exportBaseName}
          disableAnimation
        />
      </ChartExportSurface>
      <ChartPanelCard
        title={variablesetName}
        description={variablesetDescription ?? null}
        chartContent={chartContent}
        exportable
        onExportImageAction={exportPNG}
        onExportExcelAction={handleExcelExport}
        onExportPowerPointAction={handlePowerPointExport}
        exportDisabled={false}
        availableChartTypes={[]}
        selectedChartType="horizontalStackedBar"
        onChartTypeChangeAction={() => {}}
      />
    </div>
  );
}
