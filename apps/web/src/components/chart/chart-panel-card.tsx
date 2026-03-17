"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAppContext } from "@/context/app-context";
import { getVariableLabel } from "@/lib/variable-helpers";
import { type DatasetVariableWithAttributes } from "@/types/dataset-variable";
import { type AnalysisChartType, type StatsResponse } from "@/types/stats";
import { SplitVariableSelector } from "../project/split-variable-selector";
import { Code } from "../ui/code";
import { ChartExportMenu } from "./chart-export-menu";
import { getChartIcon } from "./chart-shared";

type ChartPanelCardProps = {
  variable: DatasetVariableWithAttributes;
  stats: StatsResponse;
  description: string | null;
  chartContent: ReactNode;
  footerContent?: ReactNode;
  exportable?: boolean;
  onExportImage?: () => void;
  onExportExcel?: () => void;
  onExportPowerPoint?: () => void;
  exportDisabled?: boolean;
  availableChartTypes: AnalysisChartType[];
  selectedChartType: AnalysisChartType;
  onChartTypeChange: (chartType: AnalysisChartType) => void;
  selectedSplitVariable?: string | null;
  onSplitVariableChangeAction?: (splitVariable: string | null) => void;
  canUseSplitVariable?: boolean;
  datasetId?: string;
  isMultiResponseIndividual?: boolean;
  splitVariables?: DatasetVariableWithAttributes[];
  isSplitVariablesLoading?: boolean;
};

export function ChartPanelCard({
  variable,
  stats,
  description,
  chartContent,
  footerContent,
  exportable = true,
  onExportImage,
  onExportExcel,
  onExportPowerPoint,
  exportDisabled = false,
  availableChartTypes,
  selectedChartType,
  onChartTypeChange,
  selectedSplitVariable,
  onSplitVariableChangeAction,
  canUseSplitVariable = false,
  datasetId,
  isMultiResponseIndividual = false,
  splitVariables,
  isSplitVariablesLoading,
}: ChartPanelCardProps) {
  const t = useTranslations("projectAdhocAnalysis");
  const { debugMode } = useAppContext();

  const footerActions = footerContent ?? (
    <>
      <div>
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
          onExportImage={onExportImage}
          onExportExcel={onExportExcel}
          onExportPowerPoint={onExportPowerPoint}
        />
      )}
    </>
  );

  return (
    <Tabs defaultValue="chart" className="w-full">
      {debugMode && (
        <TabsList>
          <TabsTrigger value="chart">{t("tabs.chart")}</TabsTrigger>
          <TabsTrigger value="variable">{t("tabs.variable")}</TabsTrigger>
          <TabsTrigger value="stats">{t("tabs.stats")}</TabsTrigger>
        </TabsList>
      )}
      <TabsContent value="chart">
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle>{getVariableLabel(variable)}</CardTitle>
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
                      {getChartIcon(chartType)}
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
      {debugMode && (
        <TabsContent value="variable">
          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle>{getVariableLabel(variable)}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
              <Code>{JSON.stringify(variable, null, 2)}</Code>
            </CardContent>
          </Card>
        </TabsContent>
      )}
      {debugMode && (
        <TabsContent value="stats">
          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle>{getVariableLabel(variable)}</CardTitle>
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
