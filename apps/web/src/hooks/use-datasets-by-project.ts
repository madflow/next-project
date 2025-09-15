import { Dataset } from "@/types/dataset";
import { Project } from "@/types/project";
import { ApiResponsePayload, UseQueryApiOptions, useQueryApi } from "./use-api";

type ApiResponseRow = {
  datasets: Dataset;
  projects: Project;
};

export function useDatasetsByProject(projectId: string, options?: UseQueryApiOptions) {
  const endpoint = `/api/projects/${projectId}/datasets`;

  let finalOptions: UseQueryApiOptions;
  if (!options) {
    finalOptions = {
      enabled: !!projectId,
      offset: 0,
      limit: 250,
      order: [{ column: "datasets:name", direction: "asc" }],
    };
  } else {
    finalOptions = {
      ...options,
      enabled: !!projectId && options.enabled,
    };
  }

  finalOptions.queryKey = ["datasets", "by-project", projectId];

  return useQueryApi<ApiResponsePayload<ApiResponseRow>>(endpoint, finalOptions);
}
