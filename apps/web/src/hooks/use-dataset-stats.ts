import { UseMutationOptions, useMutation } from "@tanstack/react-query";

// Types for the request payload
export interface StatsVariable {
  variable: string;
}

export interface StatsRequest {
  variables: StatsVariable[];
}

// Types for the response
export interface FrequencyItem {
  value: number;
  counts: number;
  percentages: number;
}

export interface VariableStats {
  count: number;
  mode: number[];
  mean: number;
  std: number;
  min: number;
  max: number;
  median: number;
  range: number;
  frequency_table: FrequencyItem[];
}

export interface StatsResponseItem {
  variable: string;
  stats: VariableStats;
}

export type StatsResponse = StatsResponseItem[];

// Custom hook
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
