"use client";

import { useState } from "react";
import { parseCountedValue } from "@/lib/multi-response-utils";
import type { DatasetVariableWithAttributes } from "@/types/dataset-variable";
import type { VariablesetTreeNode } from "@/types/dataset-variableset";
import type { StatsResponse } from "@/types/stats";
import { AdhocChart } from "./adhoc-chart";
import { BarSkeleton } from "./bar-skeleton";
import { MultiResponseChart } from "./multi-response-chart";

type MultiVariableChartsProps = {
  variables: DatasetVariableWithAttributes[];
  baseStatsData: Record<string, StatsResponse>;
  splitStatsData: Record<string, StatsResponse>;
  variableset?: VariablesetTreeNode;
  datasetId: string;
  datasetName: string;
  onStatsRequestAction: (variableName: string, splitVariable?: string) => void;
};

export function MultiVariableCharts({
  variables,
  baseStatsData,
  splitStatsData,
  variableset,
  datasetId,
  datasetName,
  onStatsRequestAction,
}: MultiVariableChartsProps) {
  const [splitVariablesBySelection, setSplitVariablesBySelection] = useState<
    Record<string, Record<string, string | null>>
  >({});

  if (variables.length === 0) {
    return <div className="text-muted-foreground">{"No variables selected"}</div>;
  }

  const hasAllStats = variables.every((variable) => baseStatsData[variable.name]);
  if (!hasAllStats) {
    return <BarSkeleton />;
  }

  const selectionKey = variables
    .map((variable) => variable.id)
    .sort()
    .join(",");

  const splitVariables = splitVariablesBySelection[selectionKey] ?? {};

  const handleSplitVariableChange = (variableName: string, splitVariable: string | null) => {
    setSplitVariablesBySelection((prev) => ({
      ...prev,
      [selectionKey]: {
        ...prev[selectionKey],
        [variableName]: splitVariable,
      },
    }));

    onStatsRequestAction(variableName, splitVariable || undefined);
  };

  const isMultiResponse = variableset?.category === "multi_response";
  const countedValue = parseCountedValue(variableset?.attributes);
  const showVariablesetHeader = variableset && !isMultiResponse;
  const showMultiResponseAggregate = Boolean(isMultiResponse && variableset);

  if (variables.length === 1) {
    const variable = variables[0];
    if (!variable) {
      return <div className="text-muted-foreground">{"No variable selected"}</div>;
    }

    const stats = splitStatsData[variable.name] || baseStatsData[variable.name];
    if (!stats) {
      return null;
    }

    return (
      <div className="flex flex-col gap-4">
        {variableset && (
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{variableset.name}</h2>
            {variableset.description && <p className="text-muted-foreground mt-1 text-sm">{variableset.description}</p>}
          </div>
        )}
        <AdhocChart
          variable={variable}
          stats={stats}
          datasetId={datasetId}
          datasetName={datasetName}
          className="w-full max-w-4xl"
          selectedSplitVariable={splitVariables[variable.name] || null}
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
        <MultiResponseChart
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

      {showVariablesetHeader && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold">{variableset.name}</h2>
          {variableset.description && <p className="text-muted-foreground mt-1 text-sm">{variableset.description}</p>}
        </div>
      )}

      {variables.map((variable) => {
        const stats = splitStatsData[variable.name] || baseStatsData[variable.name];
        if (!stats) {
          return null;
        }

        return (
          <AdhocChart
            key={variable.id}
            variable={variable}
            stats={stats}
            datasetId={datasetId}
            datasetName={datasetName}
            className="w-full max-w-4xl"
            selectedSplitVariable={splitVariables[variable.name] || null}
            onSplitVariableChangeAction={(splitVariable) => handleSplitVariableChange(variable.name, splitVariable)}
            isMultiResponseIndividual={isMultiResponse}
            countedValue={countedValue}
          />
        );
      })}
    </div>
  );
}
