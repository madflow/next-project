export interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

export type SortingState = Array<{
  id: string;
  desc: boolean;
}>;

export type ListSortDirection = "asc" | "desc";

export interface ListFilter {
  column: string;
  value: string;
}
