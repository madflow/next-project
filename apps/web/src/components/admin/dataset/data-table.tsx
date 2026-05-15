"use client";

import { keepPreviousData as keepPreviousQueryData, useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/datatable/data-table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { apiQuery } from "@/lib/api-client";
import { buildCollectionQueryInput } from "@/lib/collection-query";
import type { PaginationState, SortingState } from "@/types";
import type { DatasetWithEmbeddedOrganization } from "@/types/dataset";

interface Props {
  columns: ColumnDef<DatasetWithEmbeddedOrganization, unknown>[];
}

export function DatasetsDataTable({ columns }: Props) {
  const t = useTranslations("adminDataset");
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const input = useMemo(
    () => buildCollectionQueryInput({ input: { embed: "organization" }, pagination, search: debouncedSearch, sorting }),
    [debouncedSearch, pagination, sorting]
  );

  const {
    data: apiResponse,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    placeholderData: keepPreviousQueryData,
    ...apiQuery.dataset.list.queryOptions({
      input,
    }),
  });

  const error = queryError ? queryError.message : null;

  return (
    <DataTable<DatasetWithEmbeddedOrganization>
      columns={columns}
      data={apiResponse?.rows ?? []}
      count={apiResponse?.count ?? 0}
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
