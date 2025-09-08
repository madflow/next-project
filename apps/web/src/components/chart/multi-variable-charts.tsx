"use client";

import type { DatasetVariable } from "@/types/dataset-variable";
import type { VariablesetTreeNode } from "@/types/dataset-variableset";
import type { StatsResponse } from "@/types/stats";
import { AdhocChart } from "./adhoc-chart";

type MultiVariableChartsProps = {
  variables: DatasetVariable[];
  statsData: Record<string, StatsResponse>;
  variableset?: VariablesetTreeNode;
};

export function MultiVariableCharts({ variables, statsData, variableset }: MultiVariableChartsProps) {
  if (variables.length === 0) {
    return <div className="text-muted-foreground">{"No variables selected"}</div>;
  }

  // Check if any variable is missing stats data and suspend if so
  const hasAllStats = variables.every(variable => statsData[variable.name]);
  if (!hasAllStats) {
    // Create a suspended promise that will resolve when data is available
    throw new Promise(() => {}); // This will trigger Suspense
  }

  if (variables.length === 1) {
    const variable = variables[0];
    if (!variable) return <div className="text-muted-foreground">{"No variable selected"}</div>;
    
    const stats = statsData[variable.name]!; // We know it exists due to hasAllStats check
    return (
      <div className="flex flex-col gap-4">
        {variableset && (
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{variableset.name}</h2>
            {variableset.description && (
              <p className="text-sm text-muted-foreground mt-1">{variableset.description}</p>
            )}
          </div>
        )}
        <AdhocChart variable={variable} stats={stats} className="w-[600px]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {variableset && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold">{variableset.name}</h2>
          {variableset.description && (
            <p className="text-sm text-muted-foreground mt-1">{variableset.description}</p>
          )}
        </div>
      )}
      {variables.map((variable) => {
        const stats = statsData[variable.name]!; // We know it exists due to hasAllStats check
        return (
          <AdhocChart
            key={variable.id}
            variable={variable}
            stats={stats}
            className="w-[600px]"
          />
        );
      })}
    </div>
  );
}