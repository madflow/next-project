import {
  type PaginationState as ReactTablePaginationState,
  type SortingState as ReactTableSortingState,
} from "@tanstack/react-table";
import { type PaginationState, type SortingState } from "@/types/index";

/**
 * Converts react-table's pagination state to our custom pagination state
 */
export function toCustomPagination(pagination: ReactTablePaginationState): PaginationState {
  return {
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
  };
}

/**
 * Converts react-table's sorting state to our custom sorting state
 */
export function toCustomSorting(sorting: ReactTableSortingState): SortingState {
  return sorting.map((item) => ({
    id: item.id,
    desc: item.desc,
  }));
}

/**
 * Converts our custom pagination state to react-table's pagination state
 */
export function toReactTablePagination(pagination: PaginationState): ReactTablePaginationState {
  return {
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
  };
}

/**
 * Converts our custom sorting state to react-table's sorting state
 */
export function toReactTableSorting(sorting: SortingState): ReactTableSortingState {
  return sorting.map((item) => ({
    id: item.id,
    desc: item.desc,
  }));
}
