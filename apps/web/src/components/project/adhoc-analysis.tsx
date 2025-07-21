"use client";

import { useEffect, useState } from "react";
import { DatasetSelect } from "@/components/form/dataset-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDatasetStats } from "@/hooks/use-dataset-stats";
import { DatasetVariable } from "@/types/dataset-variable";
import { type Project } from "@/types/project";
import { StatsRequest } from "@/types/stats";
import { BarAdhoc } from "../chart/bar-adhoc";
import { CentralTendency } from "../chart/central-tendency-card";
import { PieAdhoc } from "../chart/pie-adhoc";
import { ThemeSelector } from "../theme-selector";
import { Code } from "../ui/code";
import { AdHocVariables } from "./adhoc-variables";

type AdHocAnalysisProps = {
  project: Project;
};

export function AdHocAnalysis({ project }: AdHocAnalysisProps) {
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [selectedVariable, setSelectedVariable] = useState<DatasetVariable | null>(null);

  const { data, mutate } = useDatasetStats(selectedDataset || "", {
    onError: (error) => {
      console.error("Error fetching dataset stats:", error);
    },
  });

  useEffect(() => {
    if (selectedVariable) {
      const request: StatsRequest = {
        variables: selectedVariable ? [{ variable: selectedVariable.name }] : [],
      };

      mutate(request);
    }
  }, [selectedVariable, mutate]);

  const handleAddVariable = (variable: DatasetVariable) => {
    setSelectedVariable(variable);
  };
  return (
    <div className="theme-container flex gap-4">
      <div className="flex w-64 max-w-64 min-w-64 flex-col gap-4">
        <ThemeSelector />
        <DatasetSelect
          projectId={project.id}
          onValueChange={(value) => {
            setSelectedDataset(value);
          }}
        />
        {selectedDataset && <AdHocVariables datasetId={selectedDataset} onAddVariable={handleAddVariable} />}
      </div>
      {selectedDataset && selectedVariable && data && (
        <Tabs defaultValue="chart" className="w-full">
          <TabsList>
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="variable">Variable</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>
          <TabsContent value="chart" className="flex flex-col gap-4">
            <BarAdhoc variable={selectedVariable} stats={data} />
            <PieAdhoc variable={selectedVariable} stats={data} />
            <CentralTendency variable={selectedVariable} stats={data} />
          </TabsContent>
          <TabsContent value="variable">
            <Code>{JSON.stringify(selectedVariable, null, 2)}</Code>
          </TabsContent>
          <TabsContent value="stats">
            <Code>{JSON.stringify(data, null, 2)}</Code>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
