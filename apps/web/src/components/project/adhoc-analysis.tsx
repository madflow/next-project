"use client";

import { useTranslations } from "next-intl";
import { Suspense, useEffect, useState } from "react";
import { DatasetSelect } from "@/components/form/dataset-select";
import { useDatasetStats } from "@/hooks/use-dataset-stats";
import { type Project } from "@/types/project";
import { StatsRequest, StatsResponse } from "@/types/stats";
import { MultiVariableCharts } from "../chart/multi-variable-charts";
import BarSkeleton from "../chart/bar-skeleton";
import { ThemeSelector } from "../theme-selector";
import { AdHocVariablesetSelector, SelectionItem } from "./adhoc-variableset-selector";
import { VariablesetDescription } from "./variableset-description";

type AdHocAnalysisProps = {
  project: Project;
};

export function AdHocAnalysis({ project }: AdHocAnalysisProps) {
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [currentSelection, setCurrentSelection] = useState<SelectionItem | null>(null);
  const [statsData, setStatsData] = useState<Record<string, StatsResponse>>({});

  const t = useTranslations("projectAdhocAnalysis");

  const { mutate } = useDatasetStats(selectedDataset || "", {
    onError: (error) => {
      console.error(t("errors.fetchStats"), error);
    },
  });

  useEffect(() => {
    if (currentSelection) {
      const variables = currentSelection.type === "variable" && currentSelection.variable 
        ? [currentSelection.variable]
        : currentSelection.variables || [];

      if (variables.length > 0) {
        // Initialize stats data for all variables without split variables
        // Individual split variable requests will be handled by MultiVariableCharts
        const request: StatsRequest = {
          variables: variables.map(v => ({ variable: v.name })),
        };

        mutate(request, {
          onSuccess: (data) => {
            const newStatsData: Record<string, StatsResponse> = {};
            variables.forEach((variable, index) => {
              if (data[index]) {
                newStatsData[variable.name] = [data[index]];
              }
            });
            setStatsData(newStatsData);
          },
        });
      }
    }
  }, [currentSelection, mutate]);

  const handleSelectionChange = (selection: SelectionItem) => {
    setCurrentSelection(selection);
    setStatsData({});
  };

  const handleStatsRequest = (variableName: string, splitVariable?: string) => {
    if (currentSelection) {
      const request: StatsRequest = {
        variables: [{ variable: variableName, split_variable: splitVariable }],
      };

      mutate(request, {
        onSuccess: (data) => {
          const responseItem = data[0];
          if (responseItem) {
            setStatsData(prev => ({
              ...prev,
              [variableName]: [responseItem]
            }));
          }
        },
      });
    }
  };

  const selectedVariables = currentSelection?.type === "variable" && currentSelection.variable
    ? [currentSelection.variable]
    : currentSelection?.variables || [];

  return (
    <div className="theme-container flex gap-4">
      <div className="flex w-64 max-w-64 min-w-64 flex-col gap-4">
        <ThemeSelector className="w-full" />
        <DatasetSelect
          projectId={project.id}
          onValueChangeAction={(value) => {
            setSelectedDataset(value);
            setCurrentSelection(null);
            setStatsData({});
          }}
        />
        {selectedDataset && (
          <AdHocVariablesetSelector 
            datasetId={selectedDataset} 
            onSelectionChangeAction={handleSelectionChange} 
          />
        )}
        {currentSelection?.type === "set" && currentSelection.variableset && (
          <VariablesetDescription 
            variableset={currentSelection.variableset}
            variables={currentSelection.variables}
          />
        )}
      </div>
      
      {selectedDataset && currentSelection && selectedVariables.length > 0 && (
        <Suspense fallback={<BarSkeleton />}>
          <MultiVariableCharts 
            variables={selectedVariables}
            statsData={statsData}
            variableset={currentSelection?.type === "set" ? currentSelection.variableset : undefined}
            datasetId={selectedDataset}
            onStatsRequestAction={handleStatsRequest}
          />
        </Suspense>
      )}
    </div>
  );
}
