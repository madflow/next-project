"use client";

import { useTranslations } from "next-intl";
import type { DatasetVariableWithAttributes } from "@/types/dataset-variable";
import type { VariablesetTreeNode } from "@/types/dataset-variableset";
import type { StatsResponse } from "@/types/stats";
import { MultiResponseAggregateCard } from "../cards/multi-response-aggregate-card";
import { VariableChartCardItem } from "../cards/variable-chart-card-item";
import { BarSkeleton } from "../shared/bar-skeleton";
import { useChartSelectionSectionController } from "./use-chart-selection-section-controller";
import { VariablesetHeader } from "./variableset-header";

type SplitStatsEntry = {
  splitVariable: string;
  stats: StatsResponse;
};

type ChartSelectionSectionProps = {
  variables: DatasetVariableWithAttributes[];
  baseStatsData: Record<string, StatsResponse>;
  splitStatsData: Record<string, SplitStatsEntry>;
  variableset?: VariablesetTreeNode;
  datasetId: string;
  datasetName: string;
  onStatsRequestAction: (variableName: string, splitVariable?: string) => void;
  multiResponseAggregateOnly?: boolean;
  hideVariablesetHeader?: boolean;
};

export function ChartSelectionSection({
  variables,
  baseStatsData,
  splitStatsData,
  variableset,
  datasetId,
  datasetName,
  onStatsRequestAction,
  multiResponseAggregateOnly = false,
  hideVariablesetHeader = false,
}: ChartSelectionSectionProps) {
  const t = useTranslations("projectAdhocAnalysis");
  const {
    countedValue,
    getStatsForVariable,
    handleSplitVariableChange,
    hasAllStats,
    isMultiResponse,
    selectedSplitVariables,
    showMultiResponseAggregate,
    showVariablesetHeader,
  } = useChartSelectionSectionController({
    variables,
    baseStatsData,
    splitStatsData,
    variableset,
    onStatsRequestAction,
  });

  if (variables.length === 0) {
    return <div className="text-muted-foreground">{t("noVariablesSelected")}</div>;
  }

  if (!hasAllStats) {
    return <BarSkeleton />;
  }

  if (multiResponseAggregateOnly && showMultiResponseAggregate && variableset) {
    return (
      <MultiResponseAggregateCard
        variables={variables}
        statsData={baseStatsData}
        variablesetName={variableset.name}
        variablesetDescription={variableset.description}
        countedValue={countedValue}
        datasetId={datasetId}
        datasetName={datasetName}
        className="w-full max-w-4xl"
      />
    );
  }

  if (variables.length === 1) {
    const variable = variables[0];
    if (!variable) {
      return <div className="text-muted-foreground">{t("noVariableSelected")}</div>;
    }

    const stats = getStatsForVariable(variable.name);
    if (!stats) {
      return null;
    }

    return (
      <div className="flex flex-col gap-4">
        {variableset && !hideVariablesetHeader && <VariablesetHeader variableset={variableset} />}
        <VariableChartCardItem
          variable={variable}
          stats={stats}
          datasetId={datasetId}
          datasetName={datasetName}
          selectedSplitVariable={selectedSplitVariables[variable.name] || null}
          onSplitVariableChangeAction={(splitVariable) => handleSplitVariableChange(variable.name, splitVariable)}
          isMultiResponseIndividual={isMultiResponse}
          countedValue={countedValue}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {showMultiResponseAggregate && variableset && (
        <MultiResponseAggregateCard
          variables={variables}
          statsData={baseStatsData}
          variablesetName={variableset.name}
          variablesetDescription={variableset.description}
          countedValue={countedValue}
          datasetId={datasetId}
          datasetName={datasetName}
          className="w-full max-w-4xl"
        />
      )}

      {showVariablesetHeader && variableset && !hideVariablesetHeader && (
        <VariablesetHeader variableset={variableset} />
      )}

      {variables.map((variable) => {
        const stats = getStatsForVariable(variable.name);
        if (!stats) {
          return null;
        }

        return (
          <VariableChartCardItem
            key={variable.id}
            variable={variable}
            stats={stats}
            datasetId={datasetId}
            datasetName={datasetName}
            selectedSplitVariable={selectedSplitVariables[variable.name] || null}
            onSplitVariableChangeAction={(splitVariable) => handleSplitVariableChange(variable.name, splitVariable)}
            isMultiResponseIndividual={isMultiResponse}
            countedValue={countedValue}
          />
        );
      })}
    </div>
  );
}
