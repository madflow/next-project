import {
  type QueryFunction,
  type QueryKey,
  type QueryObserverResult,
  type UseQueryOptions,
  useQuery,
} from "@tanstack/react-query";
import * as React from "react";
import { type ListFilter, type ListSortDirection, type PaginationState, type SortingState } from "@/types";

type UseQueryApiOptions<T> = {
  endpoint: string;
  pagination: PaginationState;
  sorting: SortingState;
  search?: string;
  filters?: ListFilter[];
  queryKey?: QueryKey;
  enabled?: boolean;
  keepPreviousData?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
};

export const useQueryApi = <T>(options: UseQueryApiOptions<T>): QueryObserverResult<T, Error> => {
  const {
    endpoint,
    pagination,
    sorting,
    search,
    filters,
    queryKey = [],
    enabled = true,
    keepPreviousData = true,
    onSuccess,
    onError,
  } = options;

  const fetchData: QueryFunction<T, QueryKey> = async ({ signal }) => {
    const order: string[] = [];
    if (sorting.length > 0) {
      sorting.forEach((item) => {
        const direction: ListSortDirection = item.desc ? "desc" : "asc";
        order.push(`${item.id}.${direction}`);
      });
    }

    const params = new URLSearchParams({
      limit: pagination.pageSize.toString(),
      offset: (pagination.pageIndex * pagination.pageSize).toString(),
      ...(search && { search }),
      ...(order.length > 0 && { order: order.join(",") }),
    });

    if (filters) {
      filters.forEach((filter) => {
        params.append(filter.column, filter.value);
      });
    }

    // Handle endpoints that already have query parameters
    const url = new URL(endpoint, 'http://localhost'); // Use base URL for parsing
    const hasExistingParams = url.search;
    const separator = hasExistingParams ? '&' : '?';
    
    const response = await fetch(`${endpoint}${separator}${params.toString()}`, { signal });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Failed to fetch ${endpoint}`);
    }

    return response.json();
  };

  const queryKeyValue = React.useMemo<QueryKey>(
    () => [
      endpoint,
      { ...pagination },
      { ...sorting },
      search,
      filters,
      ...(Array.isArray(queryKey) ? queryKey : [queryKey]),
    ],
    [endpoint, pagination, sorting, search, filters, queryKey]
  );

  const queryOptions: UseQueryOptions<T, Error, T, QueryKey> = {
    queryKey: queryKeyValue,
    queryFn: fetchData,
    enabled,
    placeholderData: keepPreviousData ? (previousData) => previousData : undefined,
  };

  const result = useQuery<T, Error, T, QueryKey>(queryOptions);

  React.useEffect(() => {
    if (result.data && onSuccess) {
      onSuccess(result.data);
    }
  }, [result.data, onSuccess]);

  React.useEffect(() => {
    if (result.error && onError) {
      onError(result.error);
    }
  }, [result.error, onError]);

  return result;
};
