"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { buildCollectionQueryInput } from "@/lib/collection-query";

const SPLIT_VARIABLES_PAGE_SIZE = 250;

export function useSplitVariables(datasetId?: string, enabled: boolean = true) {
  const { data, isLoading } = useQuery({
    enabled: Boolean(datasetId) && enabled,
    queryKey: ["dataset", datasetId, "splitVariables", "all"],
    queryFn: async () => {
      if (!datasetId) {
        return [];
      }

      const splitVariables = [];
      let pageIndex = 0;

      while (true) {
        const response = await apiClient.dataset.splitVariables.list(
          buildCollectionQueryInput({
            input: { embed: "variable", id: datasetId },
            pagination: { pageIndex, pageSize: SPLIT_VARIABLES_PAGE_SIZE },
            search: "",
            sorting: [{ desc: false, id: "variable:name" }],
          })
        );

        splitVariables.push(...response.rows.flatMap((row) => (row.variable ? [row.variable] : [])));

        const fetchedCount = response.offset + response.rows.length;
        if (fetchedCount >= response.count || response.rows.length < response.limit) {
          return splitVariables;
        }

        pageIndex += 1;
      }
    },
  });

  return {
    splitVariables: data ?? [],
    isLoading,
  };
}
