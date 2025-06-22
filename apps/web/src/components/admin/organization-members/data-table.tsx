"use client";

import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Member, User } from "@repo/database/schema";
import { DataTable } from "@/components/datatable/data-table";
import type { ListFilter, PaginationState } from "@/components/datatable/types";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useQueryApi } from "@/hooks/use-query-api";

type Props = {
  organizationId: string;
  columns: ColumnDef<{ users: User; members: Member }, unknown>[];
};

type ApiResponse = {
  rows: { users: User; members: Member }[];
  count: number;
  limit: number;
  offset: number;
};

export function OrganisationMembersDataTable({ columns, organizationId }: Props) {
  const t = useTranslations();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState("");
  const [filters] = useState<ListFilter[]>([{ column: "organizationId", operator: "=", value: organizationId }]);
  const debouncedSearch = useDebouncedValue(search, 300);

  const { 
    data: apiResponse, 
    isLoading, 
    error: queryError, 
    refetch 
  } = useQueryApi<ApiResponse>({
    endpoint: "/api/members",
    pagination,
    sorting,
    search: debouncedSearch,
    filters,
    queryKey: ['organization-members', 'list', organizationId],
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
    <DataTable<{ users: User; members: Member }>
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
      searchPlaceholder={t("organizationMembers.searchPlaceholder")}
    />
  );
}
