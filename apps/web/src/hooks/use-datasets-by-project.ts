import { type Dataset } from "@/types/dataset";
import { type DatasetProject } from "@/types/dataset-project";
import { type Project } from "@/types/project";
import { ApiResponsePayload, UseQueryApiOptions, useQueryApi } from "./use-api";

type ApiResponseRow = DatasetProject & {
  dataset?: Dataset;
  project?: Project;
};

type DatasetsByProjectOptions = Omit<UseQueryApiOptions, "embed">;

function toApiQueryOrder(column: string) {
  return column.replace(/^datasets:/, "dataset:").replace(/^projects:/, "project:");
}

export function useDatasetsByProject(projectId: string, options?: DatasetsByProjectOptions) {
  const endpoint = `/api/projects/${projectId}/datasets`;

  let finalOptions: UseQueryApiOptions;
  if (!options) {
    finalOptions = {
      embed: "dataset,project",
      enabled: !!projectId,
      limit: 250,
      offset: 0,
      order: [{ column: "dataset:name", direction: "asc" }],
    };
  } else {
    finalOptions = {
      ...options,
      embed: "dataset,project",
      enabled: !!projectId && options.enabled,
      order: options.order?.map((item) => ({
        ...item,
        column: toApiQueryOrder(item.column),
      })),
    };
  }

  finalOptions.queryKey = ["datasets", "by-project", projectId];

  return useQueryApi<ApiResponsePayload<ApiResponseRow>>(endpoint, finalOptions);
}
