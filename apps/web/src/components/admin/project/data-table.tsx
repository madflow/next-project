"use client";

import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Project } from "@repo/database/schema";
import { DataTable } from "@/components/datatable/data-table";
import type { PaginationState } from "@/components/datatable/types";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useQueryApi } from "@/hooks/use-query-api";

interface Props {
  columns: ColumnDef<Project, unknown>[];
}
interface ApiResponse {
  rows: Project[];
  count: number;
  limit: number;
  offset: number;
}

export function ProjectsDataTable({ columns }: Props) {
  const t = useTranslations("project");
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const { 
    data: apiResponse, 
    isLoading, 
    error: queryError, 
    refetch 
  } = useQueryApi<ApiResponse>({
    endpoint: "/api/projects",
    pagination,
    sorting,
    search: debouncedSearch,
    queryKey: ['projects', 'list'],
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
    <DataTable<Project>
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
