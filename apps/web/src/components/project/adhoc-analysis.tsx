"use client";

import { useState } from "react";
import { DatasetDropdown } from "@/components/dropdown/dataset-dropdown";
import { DatasetVariable } from "@/types/dataset-variable";
import { type Project } from "@/types/project";
import { AdHocVariables } from "./adhoc-variables";

type AdHocAnalysisProps = {
  project: Project;
};

export function AdHocAnalysis({ project }: AdHocAnalysisProps) {
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [selectedVariable, setSelectedVariable] = useState<DatasetVariable | null>(null);

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
      <div className="flex-1">{selectedVariable && <pre>{JSON.stringify(selectedVariable, null, 2)}</pre>}</div>
    </div>
  );
}
