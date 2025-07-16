"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { DatasetDropdown } from "@/components/dropdown/dataset-dropdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsRequest, StatsResponse, useDatasetStats } from "@/hooks/use-dataset-stats";
import { DatasetVariable } from "@/types/dataset-variable";
import { type Project } from "@/types/project";
import { Code } from "../ui/code";
import { AdHocVariables } from "./adhoc-variables";

type AdHocAnalysisProps = {
  project: Project;
};
function transformToRechartsData(variableConfig: DatasetVariable, statsData: StatsResponse) {
  // Extract the valueLabels and frequency table
  const valueLabels = variableConfig.valueLabels;
  const frequencyTable = statsData[0].stats.frequency_table;

  // Transform the data by matching frequency table values to their labels
  const rechartsData = frequencyTable.map((item) => {
    const valueKey = item.value.toString(); // Convert to string to match valueLabels keys
    console.log(valueKey);
    const label = valueLabels[valueKey] || `Value ${item.value}`; // Fallback if label not found

    return {
      label: label,
      value: item.value,
      count: item.counts,
      percentage: item.percentages,
    };
  });

  return rechartsData;
}

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
    <div className="flex gap-4">
      <div className="flex w-64 flex-col gap-4">
        <DatasetDropdown
          projectId={project.id}
          onValueChange={(value) => {
            setSelectedDataset(value);
          }}
        />

        {selectedDataset && <AdHocVariables datasetId={selectedDataset} onAddVariable={handleAddVariable} />}
      </div>
      {selectedDataset && selectedVariable && data && (
        <Tabs defaultValue="chart">
          <TabsList>
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="variable">Variable</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>
          <TabsContent value="chart">
            <BarChart width={768} height={400} data={transformToRechartsData(selectedVariable, data)}>
              <XAxis angle={-90} textAnchor="end" dataKey="label" height={200} />
              <YAxis />
              <Bar dataKey="count" fill="#8884d8" label="label" />
            </BarChart>
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
