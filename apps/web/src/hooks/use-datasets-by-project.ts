import { useQuery } from "@tanstack/react-query";
import { Dataset } from "@/types/dataset";
import { Project } from "@/types/project";

type ApiResponseRow = {
  datasets: Dataset;
  projects: Project;
};

export function useDatasetsByProject(projectId: string, queryParams?: Record<string, string>) {
  const apiQueryParams = new URLSearchParams(queryParams || {});
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value) {
        apiQueryParams.set(key, value);
      }
    }
  }

  return useQuery({
    queryKey: ["datasets", "by-project", projectId, apiQueryParams.size > 0 && apiQueryParams.toString()],
    queryFn: async () => {
      const queryString = apiQueryParams ? `?${apiQueryParams.toString()}` : "";
      const url = `/api/projects/${projectId}/datasets${queryString}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch Datasets");
      }
      const data = (await response.json()) as { rows: ApiResponseRow[] };
      return data.rows || [];
    },
    staleTime: 60 * 1000,
    enabled: !!projectId,
  });
}
