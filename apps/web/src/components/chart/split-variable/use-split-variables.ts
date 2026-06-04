"use client";

import { useQuery } from "@tanstack/react-query";
import { apiQuery } from "@/lib/api-client";
import { buildCollectionQueryInput } from "@/lib/collection-query";

export function useSplitVariables(datasetId?: string, enabled: boolean = true) {
  const { data, isLoading } = useQuery({
    enabled: Boolean(datasetId) && enabled,
    ...apiQuery.dataset.splitVariables.list.queryOptions({
      input: buildCollectionQueryInput({
        input: { embed: "variable", id: datasetId ?? "" },
        pagination: { pageIndex: 0, pageSize: 100 },
        search: "",
        sorting: [{ desc: false, id: "variable:name" }],
      }),
    }),
  });

  return {
    splitVariables: data?.rows.flatMap((row) => (row.variable ? [row.variable] : [])) ?? [],
    isLoading,
  };
}
