import { z } from "zod";
import { filterSchema, orderBySchema } from "@/lib/dal";

const reservedQueryParams = ["order", "offset", "limit", "select"];

export const processUrlParams = (searchParams: URLSearchParams) => {
  const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 100);
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const search = searchParams.get("search") || "";
  const order = searchParams.get("order");

  const orderBy: z.infer<typeof orderBySchema>[] = [];

  if (order) {
    const orderFields = order.split(",");
    orderFields.forEach((field) => {
      const [column, direction] = field.split(".");
      if (direction !== "asc" && direction !== "desc") {
        return;
      }
      if (!column) {
        return;
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
    if (reservedQueryParams.includes(key)) {
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
