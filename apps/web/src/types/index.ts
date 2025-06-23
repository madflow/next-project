// Custom types for table state management
// These types are used to decouple our data fetching layer from the UI table implementation

export interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

export type SortingState = Array<{
  id: string;
  desc: boolean;
}>;

export type ListSortDirection = 'asc' | 'desc';

export interface ListFilter {
  column: string;
  value: string;
}
