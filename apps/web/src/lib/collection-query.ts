import { type ListFilter, type ListSortDirection, type PaginationState, type SortingState } from "@/types";

type QueryInputValue = string | string[] | undefined;
export type QueryInputRecord = Record<string, QueryInputValue>;

function appendFilter(input: Record<string, string | string[]>, filter: ListFilter) {
  const currentValue = input[filter.column];

  if (currentValue === undefined) {
    input[filter.column] = filter.value;
    return;
  }

  if (Array.isArray(currentValue)) {
    input[filter.column] = [...currentValue, filter.value];
    return;
  }

  input[filter.column] = [currentValue, filter.value];
}

export function buildCollectionQueryInput<TInput extends QueryInputRecord = Record<never, never>>({
  filters,
  input,
  pagination,
  search,
  sorting,
}: {
  filters?: ListFilter[];
  input?: TInput;
  pagination: PaginationState;
  search?: string;
  sorting: SortingState;
}) {
  const queryInput: Record<string, string | string[]> = {};

  if (input) {
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) {
        queryInput[key] = value;
      }
    }
  }

  filters?.forEach((filter) => {
    appendFilter(queryInput, filter);
  });

  if (search) {
    queryInput.search = search;
  }

  if (sorting.length > 0) {
    queryInput.order = sorting
      .map((item) => {
        const direction: ListSortDirection = item.desc ? "desc" : "asc";
        return `${item.id}.${direction}`;
      })
      .join(",");
  }

  queryInput.limit = pagination.pageSize.toString();
  queryInput.offset = (pagination.pageIndex * pagination.pageSize).toString();

  return queryInput as TInput & Record<string, string | string[]>;
}
