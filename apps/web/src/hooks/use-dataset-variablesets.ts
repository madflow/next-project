import { useQuery } from "@tanstack/react-query";
import { apiQuery } from "@/lib/api-client";
import type { VariablesetTreeNode } from "@/types/dataset-variableset";

export function useDatasetVariablesets(datasetId: string | null) {
  return useQuery({
    enabled: !!datasetId,
    ...apiQuery.dataset.variablesets.list.queryOptions({
      input: {
        hierarchical: "true",
        id: datasetId ?? "",
      },
      select: (data): VariablesetTreeNode[] => ("hierarchy" in data ? data.hierarchy : []),
    }),
  });
}
