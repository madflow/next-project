import "server-only";
import { createAnalysisClient } from "@/lib/analysis-client";

export interface RawDataVariableResponse {
  values: string[];
  total_count: number;
  non_empty_count: number;
  error?: string;
}

export interface RawDataResponse {
  status: string;
  message: string;
  dataset_id: string;
  data: Record<string, RawDataVariableResponse>;
}

export interface RawDataOptions {
  excludeEmpty?: boolean;
  maxValues?: number;
}

export async function fetchVariableRawData(
  datasetId: string,
  variableIds: string[],
  options: RawDataOptions = {}
): Promise<RawDataResponse> {
  const client = createAnalysisClient();

  const requestBody = {
    variables: variableIds,
    options: {
      exclude_empty: options.excludeEmpty ?? true,
      max_values: options.maxValues ?? 1000,
    },
  };

  const response = await client.fetch(`/datasets/${datasetId}/raw-data`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch raw data: ${response.statusText}`);
  }

  return response.json();
}
