"use client";

import { ColumnDef, getCoreRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table";
import { SearchIcon, XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table } from "@/components/ui/table";
import type { PaginationState, SortingState } from "@/types";
import { ErrorDisplay } from "./components/error-display";
import { LoadingDisplay } from "./components/loading-display";
import { DataTablePagination } from "./components/pagination";
import { TableBodyComponent } from "./components/table-body";
import { TableHeaderComponent } from "./components/table-header";
import { DataTableViewOptions } from "./components/view-options";
import { toCustomSorting, toReactTableSorting } from "./table-utils";

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  count: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  pagination: PaginationState;
  setPagination: (updater: PaginationState | ((old: PaginationState) => PaginationState)) => void;
  sorting: SortingState;
  setSorting: (updater: SortingState | ((old: SortingState) => SortingState)) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

export function DataTable<TData>({
  columns,
  data,
  count,
  isLoading,
  error,
  refetch,
  pagination,
  setPagination,
  sorting,
  setSorting,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
}: DataTableProps<TData>) {
  const handleSetPagination = (updater: PaginationState | ((old: PaginationState) => PaginationState)) => {
    if (typeof updater === "function") {
      setPagination(updater as (old: PaginationState) => PaginationState);
    } else {
      setPagination(updater);
    }
  };

  const handleSetSorting = (updater: SortingState | ((old: SortingState) => SortingState)) => {
    // Convert from react-table sorting state to our custom sorting state
    const newSorting = typeof updater === "function" ? updater(toCustomSorting(sorting)) : toCustomSorting(updater);
    setSorting(newSorting);
  };

  const showSearch = typeof searchValue === "string" && typeof onSearchChange === "function";

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table is a known limitation
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: handleSetSorting,
    manualPagination: true,
    manualSorting: true,
    onPaginationChange: handleSetPagination,
    state: {
      pagination,
      sorting: toReactTableSorting(sorting),
    },
    rowCount: count || 0,
  });

  return (
    <div className="rounded-md border p-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center">
          {showSearch && (
            <div className="relative w-full max-w-xs sm:w-64">
              {searchValue ? (
                <button
                  type="button"
                  data-testid="app.datatable.search-clear-button"
                  aria-label="Clear search"
                  onClick={() => onSearchChange("")}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 left-2 -translate-y-1/2 transition-colors">
                  <XIcon className="size-4" />
                </button>
              ) : (
                <span className="text-muted-foreground absolute top-1/2 left-2 -translate-y-1/2">
                  <SearchIcon className="size-4" />
                </span>
              )}
              <Input
                type="text"
                data-testid="app.datatable.search-input"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-8"
                aria-label="Search"
              />
            </div>
          )}
        </div>
        <div className="flex-shrink-0">
          <DataTableViewOptions table={table} />
        </div>
      </div>
      <Table>
        <TableHeaderComponent headerGroups={table.getHeaderGroups()} />
        {isLoading ? (
          <tbody>
            <tr>
              <td colSpan={columns.length} className="p-0">
                <LoadingDisplay />
              </td>
            </tr>
          </tbody>
        ) : error ? (
          <tbody>
            <tr>
              <td colSpan={columns.length} className="p-0">
                <ErrorDisplay message={error} onRetry={refetch} />
              </td>
            </tr>
          </tbody>
        ) : (
          <TableBodyComponent rows={table.getRowModel().rows} columnsLength={columns.length} />
        )}
      </Table>
      <div className="mt-8">
        <DataTablePagination table={table} />
      </div>
    </div>
  );
}
