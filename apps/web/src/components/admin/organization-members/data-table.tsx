"use client";

import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import React from "react";
import type { Member, User } from "@repo/database/schema";
import { DataTable } from "@/components/datatable/data-table";
import { usefetchApi } from "@/components/datatable/hooks/use-fetch-api";
import { useTableData } from "@/components/datatable/hooks/use-table-data";
import type { ListFilter, PaginationState } from "@/components/datatable/types";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

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

  const fetchFn = useCallback(
    (p: PaginationState, s: SortingState) => usefetchApi<ApiResponse>("/api/members", p, s, debouncedSearch, filters),
    [debouncedSearch, filters]
  );

  const { data, isLoading, error, refetch } = useTableData<{ users: User; members: Member }>(
    pagination,
    sorting,
    fetchFn
  );

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
