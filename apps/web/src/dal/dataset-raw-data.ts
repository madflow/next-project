export type RawDataVariableResponse = {
  values: string[];
  total_count: number;
  non_empty_count: number;
  total_non_empty_count: number;
  total_pages: number;
  page: number;
  error?: string;
};

export type RawDataResponse = {
  status: string;
  message: string;
  dataset_id: string;
  data: Record<string, RawDataVariableResponse>;
};

export type RawDataOptions = {
  excludeEmpty?: boolean;
  maxValues?: number;
  page?: number;
  pageSize?: number;
};

export async function fetchVariableRawData(
  datasetId: string,
  variableNames: string[],
  options: RawDataOptions = {}
): Promise<RawDataResponse> {
  const requestBody = {
    variables: variableNames,
    options: {
      exclude_empty: options.excludeEmpty ?? true,
      max_values: options.maxValues ?? 1000,
      page: options.page ?? 1,
      page_size: options.pageSize ?? 5,
    },
  };

  const response = await fetch(`/api/datasets/${datasetId}/raw-data`, {
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
