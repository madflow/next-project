"use client";

import { useState } from "react";
import { DatasetDropdown } from "@/components/dropdown/dataset-dropdown";
import { type Project } from "@/types/project";
import { AdHocVariables } from "./adhoc-variables";

type AdHocAnalysisProps = {
  project: Project;
};

export function AdHocAnalysis({ project }: AdHocAnalysisProps) {
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  return (
    <div className="flex w-64 flex-col gap-4">
      <DatasetDropdown
        projectId={project.id}
        onValueChange={(value) => {
          setSelectedDataset(value);
        }}
      />

      {selectedDataset && <AdHocVariables datasetId={selectedDataset} />}
    </div>
  );
}
