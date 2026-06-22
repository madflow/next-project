"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useId } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAppContext } from "@/context/app-context";
import { getVariableLabel } from "@/lib/variable-helpers";
import { type DatasetVariableWithAttributes } from "@/types/dataset-variable";
import { type AnalysisChartType, type StatsResponse } from "@/types/stats";
import { SplitVariableSelector } from "../../project/split-variable-selector";
import { Code } from "../../ui/code";
import { ChartExportMenu } from "./export-menu";
import { ChartTypeIcon } from "./type-icon";

type ChartPanelCardProps = {
  variable?: DatasetVariableWithAttributes;
  stats?: StatsResponse;
  title?: ReactNode;
  description?: ReactNode;
  chartContent: ReactNode;
  footerContent?: ReactNode;
  exportable?: boolean;
  onExportImageAction?: () => void;
  onExportExcelAction?: () => void;
  onExportPowerPointAction?: () => void;
  exportDisabled?: boolean;
  availableChartTypes: AnalysisChartType[];
  selectedChartType: AnalysisChartType;
  onChartTypeChangeAction: (chartType: AnalysisChartType) => void;
  selectedSplitVariable?: string | null;
  onSplitVariableChangeAction?: (splitVariable: string | null) => void;
  canUseSplitVariable?: boolean;
  datasetId?: string;
  isMultiResponseIndividual?: boolean;
  splitVariables?: DatasetVariableWithAttributes[];
  isSplitVariablesLoading?: boolean;
  sortByCountDesc?: boolean;
  onSortByCountDescChangeAction?: (value: boolean) => void;
};

export function ChartPanelCard({
  variable,
  stats,
  title,
  description,
  chartContent,
  footerContent,
  exportable = true,
  onExportImageAction: onExportImage,
  onExportExcelAction: onExportExcel,
  onExportPowerPointAction: onExportPowerPoint,
  exportDisabled = false,
  availableChartTypes,
  selectedChartType,
  onChartTypeChangeAction: onChartTypeChange,
  selectedSplitVariable,
  onSplitVariableChangeAction,
  canUseSplitVariable = false,
  datasetId,
  isMultiResponseIndividual = false,
  splitVariables,
  isSplitVariablesLoading,
  sortByCountDesc,
  onSortByCountDescChangeAction,
}: ChartPanelCardProps) {
  const t = useTranslations("projectAdhocAnalysis");
  const { debugMode } = useAppContext();
  const resolvedTitle = title ?? (variable ? getVariableLabel(variable) : null);
  const sortByCountId = `${useId()}-sort-by-count`;

  const footerActions = footerContent ?? (
    <>
      <div className="flex items-center gap-2">
        {(selectedChartType === "horizontalBar" || selectedChartType === "pie") &&
          onSortByCountDescChangeAction !== undefined && (
            <div className="flex items-center gap-2">
              <Switch
                id={sortByCountId}
                size="sm"
                checked={sortByCountDesc ?? false}
                onCheckedChange={onSortByCountDescChangeAction}
              />
              <Label htmlFor={sortByCountId}>{t("sortByCount")}</Label>
            </div>
          )}
        {datasetId && onSplitVariableChangeAction && canUseSplitVariable && (
          <SplitVariableSelector
            datasetId={datasetId}
            selectedSplitVariable={selectedSplitVariable || null}
            onSplitVariableChangeAction={onSplitVariableChangeAction}
            compact
            splitVariables={splitVariables}
            isLoading={isSplitVariablesLoading}
          />
        )}
      </div>
      {exportable && onExportImage && onExportExcel && onExportPowerPoint && (
        <ChartExportMenu
          disabled={exportDisabled}
          onExportImageAction={onExportImage}
          onExportExcelAction={onExportExcel}
          onExportPowerPointAction={onExportPowerPoint}
        />
      )}
    </>
  );

  return (
    <Tabs defaultValue="chart" className="w-full">
      {debugMode && (
        <TabsList>
          <TabsTrigger value="chart">{t("tabs.chart")}</TabsTrigger>
          {variable && <TabsTrigger value="variable">{t("tabs.variable")}</TabsTrigger>}
          {stats && <TabsTrigger value="stats">{t("tabs.stats")}</TabsTrigger>}
        </TabsList>
      )}
      <TabsContent value="chart">
        <Card className="shadow-xs">
          <CardHeader>
            {resolvedTitle && <CardTitle>{resolvedTitle}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
            {availableChartTypes.length > 1 && !isMultiResponseIndividual && (
              <CardAction>
                <ToggleGroup
                  type="single"
                  value={selectedChartType}
                  onValueChange={(value) => value && onChartTypeChange(value as AnalysisChartType)}
                  size="sm"
                  data-testid="chart-type-selector">
                  {availableChartTypes.map((chartType) => (
                    <ToggleGroupItem key={chartType} value={chartType} data-testid={`chart-type-${chartType}`}>
                      <ChartTypeIcon chartType={chartType} />
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </CardAction>
            )}
          </CardHeader>
          <CardContent data-testid={`chart-content-${selectedChartType}`}>{chartContent}</CardContent>
          <CardFooter className="flex items-center justify-between border-t">{footerActions}</CardFooter>
        </Card>
      </TabsContent>
      {debugMode && variable && (
        <TabsContent value="variable">
          <Card className="shadow-xs">
            <CardHeader>
              {resolvedTitle && <CardTitle>{resolvedTitle}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
              <Code>{JSON.stringify(variable, null, 2)}</Code>
            </CardContent>
          </Card>
        </TabsContent>
      )}
      {debugMode && stats && (
        <TabsContent value="stats">
          <Card className="shadow-xs">
            <CardHeader>
              {resolvedTitle && <CardTitle>{resolvedTitle}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
              <Code>{JSON.stringify(stats, null, 2)}</Code>
            </CardContent>
          </Card>
        </TabsContent>
      )}
    </Tabs>
  );
}
