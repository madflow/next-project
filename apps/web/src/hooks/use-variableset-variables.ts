import { useQuery } from "@tanstack/react-query";
import type { DatasetVariable } from "@/types/dataset-variable";

export function useVariablesetVariables(variablesetId: string | null) {
  return useQuery({
    queryKey: ["variableset-variables", variablesetId],
    queryFn: async (): Promise<{ rows: DatasetVariable[]; count: number }> => {
      if (!variablesetId) return { rows: [], count: 0 };

      const response = await fetch(`/api/variablesets/${variablesetId}/variables`);
      if (!response.ok) {
        throw new Error("Failed to fetch variables for set");
      }
      return response.json();
    },
    enabled: !!variablesetId,
  });
}
