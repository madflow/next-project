import { UseMutationOptions, useMutation } from "@tanstack/react-query";
import { StatsRequest, StatsResponse } from "@/types/stats";

export function useDatasetStats(datasetId: string, options?: UseMutationOptions<StatsResponse, Error, StatsRequest>) {
  return useMutation<StatsResponse, Error, StatsRequest>({
    mutationFn: async (payload: StatsRequest) => {
      const endpoint = `/api/datasets/${datasetId}/stats`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
    ...options,
  });
}
