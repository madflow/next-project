export type PaginationState = {
  pageIndex: number;
  pageSize: number;
};

export type ListSortDirection = "asc" | "desc";

export type ListFilter = {
  column: string;
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
