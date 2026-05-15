import { keepPreviousData as keepPreviousQueryData, useQuery } from "@tanstack/react-query";
import * as React from "react";
import { apiQuery } from "@/lib/api-client";
import { type ListFilter } from "@/types";
import { type Dataset } from "@/types/dataset";
import { type DatasetProject } from "@/types/dataset-project";
import { type Project } from "@/types/project";

type ApiResponseRow = DatasetProject & {
  dataset?: Dataset;
  project?: Project;
};

type ApiResponsePayload<T> = {
  rows: T[];
  count: number;
  limit: number;
  offset: number;
};

type ProjectDatasetsInput = Record<string, string | string[]> & {
  id: string;
  embed: string;
  limit: string;
  offset: string;
  order: string;
  search?: string;
};

type QueryOrder = {
  column: string;
  direction: "asc" | "desc";
  nullsFirst?: boolean;
};

type DatasetsByProjectOptions = {
  limit?: number;
  offset?: number;
  search?: string;
  order?: QueryOrder[];
  filters?: ListFilter[];
  enabled?: boolean;
  keepPreviousData?: boolean;
};

function appendFilter(input: Record<string, string | string[]>, filter: ListFilter) {
  const currentValue = input[filter.column];

  if (currentValue === undefined) {
    input[filter.column] = filter.value;
    return;
  }

  if (Array.isArray(currentValue)) {
    input[filter.column] = [...currentValue, filter.value];
    return;
  }

  input[filter.column] = [currentValue, filter.value];
}

function toApiQueryOrder(column: string) {
  return column.replace(/^datasets:/, "dataset:").replace(/^projects:/, "project:");
}

export function useDatasetsByProject(projectId: string, options?: DatasetsByProjectOptions) {
  const queryInput = React.useMemo<ProjectDatasetsInput>(() => {
    const input: ProjectDatasetsInput = {
      embed: "dataset,project",
      id: projectId,
      limit: (options?.limit ?? 250).toString(),
      offset: (options?.offset ?? 0).toString(),
      order:
        options?.order?.map((item) => `${toApiQueryOrder(item.column)}.${item.direction}`).join(",") ??
        "dataset:name.asc",
    };

    if (options?.search) {
      input.search = options.search;
    }

    options?.filters?.forEach((filter) => {
      appendFilter(input, filter);
    });

    return input;
  }, [options, projectId]);

  return useQuery<ApiResponsePayload<ApiResponseRow>, Error>({
    enabled: !!projectId && (options?.enabled ?? true),
    placeholderData: options?.keepPreviousData === false ? undefined : keepPreviousQueryData,
    ...apiQuery.project.datasets.list.queryOptions({
      input: queryInput,
    }),
  });
}
