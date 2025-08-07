import {
  type QueryFunction,
  type QueryKey,
  type QueryObserverResult,
  type UseQueryOptions,
  useQuery,
} from "@tanstack/react-query";
import * as React from "react";
import { z } from "zod";

export const apiQueryOrderSchema = z.array(
  z.object({ column: z.string(), direction: z.enum(["asc", "desc"]), nullsFirst: z.boolean().optional() })
);

export const apiQueryFilterSchema = z.object({ column: z.string(), value: z.string(), operator: z.enum(["eq", "="]) });

export const apiQueryHookParamsSchema = z.object({
  limit: z.number().optional(),
  offset: z.number().optional(),
  search: z.string().optional(),
  order: apiQueryOrderSchema.optional(),
  filters: z.array(apiQueryFilterSchema).optional(),
  queryKey: z.array(z.any()).optional(),
  enabled: z.boolean().optional(),
  keepPreviousData: z.boolean().optional(),
});

export type ApiResponsePayload<T> = {
  rows: T[];
  count: number;
  limit: number;
  offset: number;
};
export type UseQueryApiOptions = z.infer<typeof apiQueryHookParamsSchema>;

export const useQueryApi = <T>(
  endpoint: string,
  useQueryOptions: UseQueryApiOptions
): QueryObserverResult<T, Error> => {
  const options = apiQueryHookParamsSchema.parse(useQueryOptions);

  const fetchData: QueryFunction<T, QueryKey> = async ({ signal }) => {
    const params = new URLSearchParams();
    if (options.limit) {
      params.append("limit", options.limit.toString());
    }
    if (options.offset) {
      params.append("offset", options.offset.toString());
    }
    if (options.search) {
      params.append("search", options.search);
    }
    if (options.order) {
      params.append("order", options.order.map((item) => `${item.column}.${item.direction}`).join(","));
    }
    if (options.filters) {
      options.filters.forEach((filter) => {
        params.append(filter.column, filter.value);
      });
    }

    const response = await fetch(`${endpoint}?${params.toString()}`, { signal });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Failed to fetch ${endpoint}`);
    }
    return await response.json();
  };

  const queryKeyValue = React.useMemo<QueryKey>(() => {
    return [options.queryKey, options.limit, options.offset, options.search, options.order, options.filters].filter(
      (item) => item
    );
  }, [options]);

  const queryOptions: UseQueryOptions<T, Error, T, QueryKey> = {
    queryKey: queryKeyValue,
    queryFn: fetchData,
    enabled: options.enabled,
    placeholderData: options.keepPreviousData ? (previousData) => previousData : undefined,
  };

  return useQuery<T, Error, T, QueryKey>(queryOptions);
};
