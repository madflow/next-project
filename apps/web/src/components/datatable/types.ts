import { type PaginationState, type ListSortDirection, type ListFilter as GlobalListFilter } from "@/types";

export type { PaginationState, ListSortDirection };

export type ListFilter = GlobalListFilter & {
  operator: string;
  value: string;
};

export type ListResult<T> = {
  rows: T[];
  count: number;
  limit: number;
  offset: number;
};

export type TableDataState<T> = {
  data: T[];
  count: number;
  limit: number;
  offset: number;
};

export type UseTableDataResult<T> = {
  data: TableDataState<T>;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};
