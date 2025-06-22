"use client";

import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import React from "react";
import type { Project } from "@repo/database/schema";
import { DataTable } from "@/components/datatable/data-table";
import { usefetchApi } from "@/components/datatable/hooks/use-fetch-api";
import { useTableData } from "@/components/datatable/hooks/use-table-data";
import type { PaginationState } from "@/components/datatable/types";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

interface Props {
  columns: ColumnDef<Project, unknown>[];
}
export function ProjectsDataTable({ columns }: Props) {
  const t = useTranslations("project");
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  interface ApiResponse {
    rows: Project[];
    count: number;
    limit: number;
    offset: number;
  }

  const fetchFn = useCallback(
    (p: PaginationState, s: SortingState) => usefetchApi<ApiResponse>("/api/projects", p, s, debouncedSearch),
    [debouncedSearch]
  );

  const { data, isLoading, error, refetch } = useTableData<Project>(pagination, sorting, fetchFn);

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
