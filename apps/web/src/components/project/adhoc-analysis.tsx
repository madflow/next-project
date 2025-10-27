"use client";

import { useTranslations } from "next-intl";
import { Suspense, useEffect, useState } from "react";
import { useThemeConfig } from "@/components/active-theme";
import { DatasetSelect } from "@/components/form/dataset-select";
import { useAdhocPersistence } from "@/hooks/use-adhoc-persistence";
import { useDatasetStats } from "@/hooks/use-dataset-stats";
import { type Project } from "@/types/project";
import { StatsRequest, StatsResponse } from "@/types/stats";
import BarSkeleton from "../chart/bar-skeleton";
import { MultiVariableCharts } from "../chart/multi-variable-charts";
import { AdHocVariablesetSelector, SelectionItem } from "./adhoc-variableset-selector";

type AdHocAnalysisProps = {
  project: Project;
};

export function AdHocAnalysis({ project }: AdHocAnalysisProps) {
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [currentSelection, setCurrentSelection] = useState<SelectionItem | null>(null);
  const [statsData, setStatsData] = useState<Record<string, StatsResponse>>({});

  const t = useTranslations("projectAdhocAnalysis");
  const { setActiveTheme } = useThemeConfig();
  const { restoreState, saveDataset, saveCurrentSelection } = useAdhocPersistence(project.id);

  // Restore state from localStorage on mount
  useEffect(() => {
    const restoredState = restoreState();
    if (restoredState) {
      if (restoredState.selectedDataset) {
        setSelectedDataset(restoredState.selectedDataset);
      }
      if (restoredState.selectedTheme && restoredState.selectedTheme !== "default") {
        setActiveTheme(restoredState.selectedTheme);
      }
    }
  }, [restoreState, setActiveTheme]);

  const { mutate } = useDatasetStats(selectedDataset || "", {
    onError: (error) => {
      console.error(t("errors.fetchStats"), error);
    },
  });

  useEffect(() => {
    if (currentSelection) {
      const variables =
        currentSelection.type === "variable" && currentSelection.variable
          ? [currentSelection.variable]
          : currentSelection.variables || [];

      if (variables.length > 0) {
        // Initialize stats data for all variables without split variables
        // Individual split variable requests will be handled by MultiVariableCharts
        const request: StatsRequest = {
          variables: variables.map((v) => ({ variable: v.name })),
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
            setStatsData((prev) => ({
              ...prev,
              [variableName]: [responseItem],
            }));
          }
        },
      });
    }
  };

  const selectedVariables =
    currentSelection?.type === "variable" && currentSelection.variable
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
          <AdHocVariablesetSelector datasetId={selectedDataset} onSelectionChangeAction={handleSelectionChange} />
        )}
      </div>

      {selectedDataset && currentSelection && selectedVariables.length > 0 && (
        <Suspense fallback={<BarSkeleton />}>
          <MultiVariableCharts
            variables={selectedVariables}
            statsData={statsData}
            variableset={
              currentSelection?.type === "set" ? currentSelection.variableset : currentSelection?.parentVariableset
            }
            datasetId={selectedDataset}
            onStatsRequestAction={handleStatsRequest}
          />
        </Suspense>
      )}
    </div>
  );
}
