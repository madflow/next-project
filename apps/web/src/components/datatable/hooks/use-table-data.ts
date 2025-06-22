"use client";

import { SortingState } from "@tanstack/react-table";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ListResult, PaginationState, TableDataState, UseTableDataResult } from "../types";

export function useTableData<T>(
  pagination: PaginationState,
  sorting: SortingState,
  fetchDataFn: (pagination: PaginationState, sorting: SortingState) => Promise<ListResult<T>>,
  onError?: (err: unknown) => void
): UseTableDataResult<T> {
  const [data, setData] = useState<TableDataState<T>>({
    data: [],
    count: 0,
    limit: 0,
    offset: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastPagination = useRef(pagination);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchDataFn(pagination, sorting);
      setData({
        data: Array.isArray(result) ? result : result.rows || [],
        count: (result as ListResult<T>).count || 0,
        limit: (result as ListResult<T>).limit || pagination.pageSize,
        offset: (result as ListResult<T>).offset || pagination.pageIndex * pagination.pageSize,
      });
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again.");
      if (onError) onError(err);
    } finally {
      setIsLoading(false);
    }
  }, [pagination, sorting, fetchDataFn, onError]);

  useEffect(() => {
    if (
      lastPagination.current.pageIndex !== pagination.pageIndex ||
      lastPagination.current.pageSize !== pagination.pageSize
    ) {
      setIsLoading(true);
    }
    lastPagination.current = pagination;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination, sorting, fetchDataFn]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}
