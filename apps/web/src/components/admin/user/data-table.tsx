"use client";

import { keepPreviousData as keepPreviousQueryData, useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/datatable/data-table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { apiQuery } from "@/lib/api-client";
import { buildCollectionQueryInput } from "@/lib/collection-query";
import type { PaginationState, SortingState } from "@/types/index";
import type { AuthUser } from "@/types/user";

interface Props {
  columns: ColumnDef<AuthUser, unknown>[];
}

export function UsersDataTable({ columns }: Props) {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const t = useTranslations("user");

  const input = useMemo(
    () => buildCollectionQueryInput({ pagination, search: debouncedSearch, sorting }),
    [debouncedSearch, pagination, sorting]
  );

  const {
    data: apiResponse,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    placeholderData: keepPreviousQueryData,
    ...apiQuery.user.list.queryOptions({
      input,
    }),
  });

  // Convert Error object to string for the DataTable component
  const error = queryError ? queryError.message : null;

  return (
    <DataTable<AuthUser>
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
      searchPlaceholder={t("search.placeholder")}
    />
  );
}
