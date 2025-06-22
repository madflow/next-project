import { SortingState } from "@tanstack/react-table";
import { ListFilter, ListSortDirection, PaginationState } from "../types";

export const usefetchApi = async <T>(
  endPoint: string,
  p: PaginationState,
  s: SortingState,
  search?: string,
  filters?: ListFilter[]
): Promise<T> => {
  const order: string[] = [];
  if (s.length > 0) {
    s.forEach((item) => {
      const direction: ListSortDirection = item.desc ? "desc" : "asc";
      order.push(`${item.id}.${direction}`);
    });
  }
  try {
    const params = new URLSearchParams({
      limit: p.pageSize.toString(),
      offset: (p.pageIndex * p.pageSize).toString(),
      ...(search && { search }),
      order: order.join(","),
    });

    if (filters) {
      filters.forEach((filter) => {
        params.append(filter.column, filter.value);
      });
    }

    const response = await fetch(`${endPoint}?${params.toString()}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Failed to fetch ${endPoint}`);
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error(`Error in fetchApi: ${endPoint}`, error);
    throw error;
  }
};
