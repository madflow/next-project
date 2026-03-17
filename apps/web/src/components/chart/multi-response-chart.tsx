"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { useThemeConfig } from "@/components/active-theme";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrganizationTheme } from "@/context/organization-theme-context";
import { useChartExport } from "@/hooks/use-chart-export";
import {
  buildExportMetaLine,
  createMultiResponseExcelExportPayload,
  createMultiResponsePowerPointExportPayload,
  exportExcelForDataset,
  exportPowerPointForDataset,
  getExportPalette,
  sanitizeExportBaseName,
} from "@/lib/adhoc-export";
import { transformToMultiResponseData } from "@/lib/analysis-bridge";
import { CHART_Y_AXIS_WIDTH, PERCENTAGE_CHART_DECIMALS, formatChartValue } from "@/lib/chart-constants";
import { getPlotAreaHorizontalBorderCoordinates } from "@/lib/chart-grid";
import { type DatasetVariableWithAttributes } from "@/types/dataset-variable";
import { type StatsResponse } from "@/types/stats";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";
import { ChartExportMenu } from "./chart-export-menu";
import { ChartExportSurface } from "./chart-export-surface";

type MultiResponseChartProps = {
  variables: DatasetVariableWithAttributes[];
  statsData: Record<string, StatsResponse>;
  variablesetName: string;
  variablesetDescription?: string | null;
  countedValue?: number;
  datasetId: string;
  datasetName: string;
} & React.HTMLAttributes<HTMLDivElement>;

function MultiResponseChartContent({
  chartConfig,
  chartData,
  chartRef,
  fileName,
}: {
  chartConfig: ChartConfig;
  chartData: ReturnType<typeof transformToMultiResponseData>;
  chartRef?: React.Ref<HTMLDivElement>;
  fileName: string;
}) {
  return (
    <ChartContainer config={chartConfig} ref={chartRef} data-export-filename={fileName}>
      <BarChart
        layout="vertical"
        margin={{
          left: 0,
        }}
        barCategoryGap={1}
        accessibilityLayer
        data={chartData}>
        <CartesianGrid vertical horizontal horizontalCoordinatesGenerator={getPlotAreaHorizontalBorderCoordinates} />
        <XAxis
          domain={[0, 100]}
          dataKey="percentage"
          type="number"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          fontSize={12}
          ticks={[0, 20, 40, 60, 80, 100]}
          tickFormatter={(value) => `${value}%`}
        />
        <YAxis
          dataKey="label"
          type="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          fontSize={12}
          width={CHART_Y_AXIS_WIDTH}
        />
        <Bar dataKey="percentage" fill="var(--color-percentage)">
          <LabelList
            dataKey="percentage"
            position="right"
            fontSize={12}
            formatter={(value: unknown) => `${formatChartValue(Number(value), PERCENTAGE_CHART_DECIMALS)}%`}
          />
        </Bar>
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
      </BarChart>
    </ChartContainer>
  );
}

export function MultiResponseChart({
  variables,
  statsData,
  variablesetName,
  variablesetDescription,
  countedValue = 1,
  datasetId,
  datasetName,
  ...props
}: MultiResponseChartProps) {
  const t = useTranslations("chartMetricsCard");
  const tAdhoc = useTranslations("projectAdhocAnalysis");
  const locale = useLocale();
  const { activeTheme } = useThemeConfig();
  const { resolveTheme } = useOrganizationTheme();
  const { displayRef, exportRef, isExportRendering, exportPNG } = useChartExport();

  const chartConfig = {
    percentage: {
      label: t("percent"),
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  const chartData = useMemo(
    () => transformToMultiResponseData(variables, statsData, countedValue),
    [countedValue, statsData, variables]
  );
  const exportBaseName = useMemo(() => sanitizeExportBaseName(`${variablesetName}-multi-response`), [variablesetName]);
  const exportMetaLine = useMemo(
    () =>
      buildExportMetaLine({
        datasetName,
        exportedAtLabel: new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date()),
        labels: {
          dataset: tAdhoc("export.meta.dataset"),
          exported: tAdhoc("export.meta.exported"),
          split: tAdhoc("export.meta.split"),
        },
      }),
    [datasetName, locale, tAdhoc]
  );
  const exportPalette = useMemo(
    () => getExportPalette(resolveTheme(activeTheme).theme.chartColors),
    [activeTheme, resolveTheme]
  );

  const handlePowerPointExport = useCallback(async () => {
    try {
      const payload = createMultiResponsePowerPointExportPayload({
        countedValue,
        fileBaseName: exportBaseName,
        metaLine: exportMetaLine,
        palette: exportPalette,
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
    exportPalette,
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
        palette: exportPalette,
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
    exportPalette,
    statsData,
    tAdhoc,
    variables,
    variablesetName,
  ]);

  return (
    <Card className="shadow-xs" data-testid="multi-response-chart" {...props}>
      <ChartExportSurface exportRef={exportRef} fileName={exportBaseName} isRendering={isExportRendering}>
        <MultiResponseChartContent chartConfig={chartConfig} chartData={chartData} fileName={exportBaseName} />
      </ChartExportSurface>
      <CardHeader>
        <CardTitle>{variablesetName}</CardTitle>
        {variablesetDescription && <p className="text-muted-foreground mt-1 text-sm">{variablesetDescription}</p>}
      </CardHeader>
      <CardContent>
        <MultiResponseChartContent
          chartConfig={chartConfig}
          chartData={chartData}
          chartRef={displayRef}
          fileName={exportBaseName}
        />
      </CardContent>

      <CardFooter>
        <ChartExportMenu
          onExportImage={exportPNG}
          onExportExcel={handleExcelExport}
          onExportPowerPoint={handlePowerPointExport}
        />
      </CardFooter>
    </Card>
  );
}
