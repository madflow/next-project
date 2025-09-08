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

  if (variables.length === 1) {
    const variable = variables[0];
    if (!variable) return <div className="text-muted-foreground">{"No variable selected"}</div>;
    
    const stats = statsData[variable.name];
    if (!stats) {
      return <div className="text-muted-foreground">{"Loading chart data..."}</div>;
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
        const stats = statsData[variable.name];
        if (!stats) {
          return (
            <div key={variable.id} className="text-muted-foreground">
              {"Loading chart for"} {variable.label || variable.name}{"..."}
            </div>
          );
        }
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