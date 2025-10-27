"use client";

import { useEffect, useRef, useState } from "react";
import type { DatasetVariable } from "@/types/dataset-variable";
import type { VariablesetTreeNode } from "@/types/dataset-variableset";
import type { StatsResponse } from "@/types/stats";
import { AdhocChart } from "./adhoc-chart";

type MultiVariableChartsProps = {
  variables: DatasetVariable[];
  statsData: Record<string, StatsResponse>;
  variableset?: VariablesetTreeNode;
  datasetId: string;
  onStatsRequestAction: (variableName: string, splitVariable?: string) => void;
};

export function MultiVariableCharts({
  variables,
  statsData,
  variableset,
  datasetId,
  onStatsRequestAction,
}: MultiVariableChartsProps) {
  const [splitVariables, setSplitVariables] = useState<Record<string, string | null>>({});
  const prevVariableIdsRef = useRef<string>("");

  // Clear split variables when switching to different variables to prevent stale selections
  useEffect(() => {
    const currentVariableIds = variables
      .map((v) => v.id)
      .sort()
      .join(",");

    // Only reset if we're switching to different variables
    if (prevVariableIdsRef.current !== "" && prevVariableIdsRef.current !== currentVariableIds) {
      setSplitVariables({});
    }

    prevVariableIdsRef.current = currentVariableIds;
  }, [variables]);

  if (variables.length === 0) {
    return <div className="text-muted-foreground">{"No variables selected"}</div>;
  }

  // Check if any variable is missing stats data and suspend if so
  const hasAllStats = variables.every((variable) => statsData[variable.name]);
  if (!hasAllStats) {
    // Create a suspended promise that will resolve when data is available
    throw new Promise(() => {}); // This will trigger Suspense
  }

  const handleSplitVariableChange = (variableName: string, splitVariable: string | null) => {
    setSplitVariables((prev) => ({
      ...prev,
      [variableName]: splitVariable,
    }));

    // Request new stats with the split variable
    onStatsRequestAction(variableName, splitVariable || undefined);
  };

  if (variables.length === 1) {
    const variable = variables[0];
    if (!variable) return <div className="text-muted-foreground">{"No variable selected"}</div>;

    const stats = statsData[variable.name]!; // We know it exists due to hasAllStats check
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
          className="w-[600px]"
          selectedSplitVariable={splitVariables[variable.name] || null}
          onSplitVariableChangeAction={(splitVariable: string | null) =>
            handleSplitVariableChange(variable.name, splitVariable)
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {variableset && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold">{variableset.name}</h2>
          {variableset.description && <p className="text-muted-foreground mt-1 text-sm">{variableset.description}</p>}
        </div>
      )}
      {variables.map((variable) => {
        const stats = statsData[variable.name]!; // We know it exists due to hasAllStats check
        return (
          <AdhocChart
            key={variable.id}
            variable={variable}
            stats={stats}
            datasetId={datasetId}
            className="w-[600px]"
            selectedSplitVariable={splitVariables[variable.name] || null}
            onSplitVariableChangeAction={(splitVariable: string | null) =>
              handleSplitVariableChange(variable.name, splitVariable)
            }
          />
        );
      })}
    </div>
  );
}
