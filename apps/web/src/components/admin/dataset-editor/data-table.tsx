"use client";

import { keepPreviousData as keepPreviousQueryData, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/datatable/data-table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { apiQuery } from "@/lib/api-client";
import { buildCollectionQueryInput } from "@/lib/collection-query";
import type { PaginationState, SortingState } from "@/types";
import type { DatasetVariable } from "@/types/dataset-variable";
import { useDatasetVariableColumns } from "./columns";

interface Props {
  datasetId: string;
}

export function DatasetVariablesDataTable({ datasetId }: Props) {
  const columns = useDatasetVariableColumns();
  const t = useTranslations("adminDatasetEditor");
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const input = useMemo(
    () => buildCollectionQueryInput({ input: { id: datasetId }, pagination, search: debouncedSearch, sorting }),
    [datasetId, debouncedSearch, pagination, sorting]
  );

  const {
    data: apiResponse,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    placeholderData: keepPreviousQueryData,
    ...apiQuery.dataset.variables.list.queryOptions({
      input,
    }),
  });

  const data = {
    data: apiResponse?.rows || [],
    count: apiResponse?.count || 0,
    limit: pagination.pageSize,
    offset: pagination.pageIndex * pagination.pageSize,
  };

  // Convert Error object to string for the DataTable component
  const error = queryError ? queryError.message : null;

  return (
    <DataTable<DatasetVariable>
      columns={columns}
      data={data.data}
      count={data.count}
      isLoading={isLoading}
      error={error}
      refetch={refetch}
      pagination={pagination}
      setPagination={setPagination}
      sorting={sorting}
      setSorting={setSorting}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder={t("searchPlaceholder")}
    />
  );
}
