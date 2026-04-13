import { z } from "zod";
import { filterSchema, orderBySchema } from "@/dal/list-options";
import { HttpException } from "@/lib/exception";

const defaultReservedQueryParams = new Set(["order", "offset", "limit", "search", "select"]);

function parsePositiveInteger(rawValue: string | null, fieldName: "limit" | "offset", fallback: number) {
  if (rawValue === null) {
    return fallback;
  }

  const parsedValue = Number.parseInt(rawValue, 10);

  if (!Number.isFinite(parsedValue) || Number.isNaN(parsedValue)) {
    throw new HttpException(400, { message: `Invalid '${fieldName}' query parameter` });
  }

  if (fieldName === "limit") {
    if (parsedValue < 1) {
      throw new HttpException(400, { message: "'limit' must be greater than 0" });
    }

    return Math.min(parsedValue, 100);
  }

  if (parsedValue < 0) {
    throw new HttpException(400, { message: "'offset' must be greater than or equal to 0" });
  }

  return parsedValue;
}

export const processUrlParams = (searchParams: URLSearchParams, options?: { reservedParams?: string[] }) => {
  const reservedQueryParams = new Set([...defaultReservedQueryParams, ...(options?.reservedParams ?? [])]);

  const limit = parsePositiveInteger(searchParams.get("limit"), "limit", 10);
  const offset = parsePositiveInteger(searchParams.get("offset"), "offset", 0);
  const search = searchParams.get("search")?.trim() || undefined;
  const order = searchParams.get("order");

  const orderBy: z.infer<typeof orderBySchema>[] = [];

  if (order) {
    const orderFields = order.split(",");
    orderFields.forEach((field) => {
      const [column, direction] = field.split(".");
      if (direction !== "asc" && direction !== "desc") {
        throw new HttpException(400, { message: `Invalid order direction for '${field}'` });
      }
      if (!column) {
        throw new HttpException(400, { message: `Invalid order column for '${field}'` });
      }
      const orderByColumn = {
        column,
        direction,
      };
      orderBy.push(orderBySchema.parse(orderByColumn));
    });
  }

  const filters: z.infer<typeof filterSchema>[] = [];
  searchParams.forEach((value, key) => {
    if (reservedQueryParams.has(key)) {
      return;
    }
    filters.push(
      filterSchema.parse({
        column: key,
        operator: "=",
        value,
      })
    );
  });

  return {
    filters,
    limit,
    offset,
    search,
    orderBy,
  };
};
