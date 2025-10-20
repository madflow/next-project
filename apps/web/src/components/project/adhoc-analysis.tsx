"use client";

import { useTranslations } from "next-intl";
import { Suspense, useEffect, useState } from "react";
import { DatasetSelect } from "@/components/form/dataset-select";
import { useDatasetStats } from "@/hooks/use-dataset-stats";
import { useAdhocPersistence } from "@/hooks/use-adhoc-persistence";
import { type Project } from "@/types/project";
import { StatsRequest, StatsResponse } from "@/types/stats";
import { MultiVariableCharts } from "../chart/multi-variable-charts";
import BarSkeleton from "../chart/bar-skeleton";
import { AdHocVariablesetSelector, SelectionItem } from "./adhoc-variableset-selector";

import { useThemeConfig } from "@/components/active-theme";

type AdHocAnalysisProps = {
  project: Project;
};

export function AdHocAnalysis({ project }: AdHocAnalysisProps) {
  const { restoreState, saveDataset, saveCurrentSelection } = useAdhocPersistence(project.id);
  
  const [selectedDataset, setSelectedDataset] = useState<string | null>(() => {
    const restoredState = restoreState();
    return restoredState?.selectedDataset || null;
  });
  
  const [currentSelection, setCurrentSelection] = useState<SelectionItem | null>(null);
  const [statsData, setStatsData] = useState<Record<string, StatsResponse>>({});

  const t = useTranslations("projectAdhocAnalysis");
  const { setActiveTheme } = useThemeConfig();

  useEffect(() => {
    const restoredState = restoreState();
    if (restoredState?.selectedTheme && restoredState.selectedTheme !== "default") {
      setActiveTheme(restoredState.selectedTheme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run on mount
  }, []);

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
          decimal_places: 2,
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
    saveCurrentSelection(selection);
  };

  const handleStatsRequest = (variableName: string, splitVariable?: string) => {
    if (currentSelection) {
      const request: StatsRequest = {
        variables: [{ variable: variableName, split_variable: splitVariable }],
        decimal_places: 2,
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
        <DatasetSelect
          projectId={project.id}
          defaultValue={selectedDataset || undefined}
          onValueChangeAction={(value) => {
            setSelectedDataset(value || null);
            setCurrentSelection(null);
            setStatsData({});
            saveDataset(value || null);
            
            // If value is empty (dataset was deleted), also clear the stored selection
            if (!value) {
              saveCurrentSelection(null);
            }
          }}
        />
        {selectedDataset && (
          <AdHocVariablesetSelector 
            datasetId={selectedDataset} 
            onSelectionChangeAction={handleSelectionChange} 
          />
        )}

      </div>
      
      {selectedDataset && currentSelection && selectedVariables.length > 0 && (
        <Suspense fallback={<BarSkeleton />}>
          <MultiVariableCharts 
            variables={selectedVariables}
            statsData={statsData}
            variableset={currentSelection?.type === "set" ? currentSelection.variableset : currentSelection?.parentVariableset}
            datasetId={selectedDataset}
            onStatsRequestAction={handleStatsRequest}
          />
        </Suspense>
      )}
    </div>
  );
}
