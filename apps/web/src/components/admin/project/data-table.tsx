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
import type { ProjectWithOrganization } from "@/types/project";

interface Props {
  columns: ColumnDef<ProjectWithOrganization, unknown>[];
}

export function ProjectsDataTable({ columns }: Props) {
  const t = useTranslations("project");
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
    ...apiQuery.project.list.queryOptions({
      input,
    }),
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
    <DataTable<ProjectWithOrganization>
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
