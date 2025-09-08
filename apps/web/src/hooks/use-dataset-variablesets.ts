import { useQuery } from "@tanstack/react-query";
import type { VariablesetTreeNode } from "@/types/dataset-variableset";

export function useDatasetVariablesets(datasetId: string | null) {
  return useQuery({
    queryKey: ["dataset-variablesets", datasetId],
    queryFn: async (): Promise<VariablesetTreeNode[]> => {
      if (!datasetId) return [];
      
      const response = await fetch(`/api/datasets/${datasetId}/variablesets?hierarchical=true`);
      if (!response.ok) {
        throw new Error("Failed to fetch variable sets");
      }
      const data = await response.json();
      return data.hierarchy || [];
    },
    enabled: !!datasetId,
  });
}