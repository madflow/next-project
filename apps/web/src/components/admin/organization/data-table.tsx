"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Organization } from "@repo/database/schema";
import { DataTable } from "@/components/datatable/data-table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useQueryApi } from "@/hooks/use-query-api";
import type { PaginationState, SortingState } from "@/types/index";

interface Props {
  columns: ColumnDef<Organization, unknown>[];
}

interface ApiResponse {
  rows: Organization[];
  count: number;
  limit: number;
  offset: number;
}

export function OrganizationsDataTable({ columns }: Props) {
  const t = useTranslations();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const {
    data: apiResponse,
    isLoading,
    error: queryError,
    refetch,
  } = useQueryApi<ApiResponse>({
    endpoint: "/api/organizations",
    pagination,
    sorting,
    search: debouncedSearch,
    queryKey: ["organizations", "list"],
    keepPreviousData: true,
  });

  const data = {
    data: apiResponse?.rows || [],
    count: apiResponse?.count || 0,
    limit: apiResponse?.limit || pagination.pageSize,
    offset: apiResponse?.offset || pagination.pageIndex * pagination.pageSize,
  };

  // Convert Error object to string for the DataTable component
  const error = queryError ? queryError.message : null;

  return (
    <DataTable<Organization>
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
      searchPlaceholder={t("organization.searchPlaceholder")}
    />
  );
}
