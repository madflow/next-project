import { ApiResponsePayload, type UseQueryApiOptions, useQueryApi } from "@/hooks/use-api";
import { DatasetVariable } from "@/types/dataset-variable";

export function useDatasetVariables(datasetId: string, options?: UseQueryApiOptions) {
  const endpoint = `/api/datasets/${datasetId}/variables`;

  let finalOptions: UseQueryApiOptions;
  if (!options) {
    finalOptions = {
      enabled: !!datasetId,
      offset: 0,
      limit: 250,
      order: [{ column: "name", direction: "asc" }],
    };
  } else {
    finalOptions = {
      ...options,
      enabled: !!datasetId && options.enabled,
    };
  }

  finalOptions.queryKey = ["datasetvariables", datasetId];

  return useQueryApi<ApiResponsePayload<DatasetVariable>>(endpoint, finalOptions);
}
