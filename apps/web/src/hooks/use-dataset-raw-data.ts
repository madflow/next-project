import { useQuery } from "@tanstack/react-query";

type RawDataVariableResponse = {
  values: string[];
  total_count: number;
  non_empty_count: number;
  total_non_empty_count: number;
  total_pages: number;
  page: number;
  error?: string;
};

type RawDataResponse = {
  status: string;
  message: string;
  dataset_id: string;
  data: Record<string, RawDataVariableResponse>;
};

type RawDataOptions = {
  excludeEmpty?: boolean;
  maxValues?: number;
  page?: number;
  pageSize?: number;
};

export function useDatasetRawData(datasetId: string | null, variableName: string | null, options: RawDataOptions = {}) {
  const excludeEmpty = options.excludeEmpty ?? true;
  const maxValues = options.maxValues ?? 1000;
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 5;

  return useQuery({
    queryKey: ["dataset-raw-data", datasetId, variableName, excludeEmpty, maxValues, page, pageSize],
    enabled: !!datasetId && !!variableName,
    queryFn: async (): Promise<RawDataResponse> => {
      if (!datasetId || !variableName) {
        throw new Error("Dataset ID and variable name are required");
      }

      const response = await fetch(`/api/datasets/${datasetId}/raw-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          variables: [variableName],
          options: {
            exclude_empty: excludeEmpty,
            max_values: maxValues,
            page,
            page_size: pageSize,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch raw data: ${response.statusText || response.status}`);
      }

      return response.json();
    },
  });
}
