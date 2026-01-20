import { type SQL, and, asc, count, desc, eq, getTableColumns, getTableName, ilike, or } from "drizzle-orm";
import type { AnyPgTable, PgColumn, PgSelect, PgTable } from "drizzle-orm/pg-core";
import type { z } from "zod";
import { defaultClient as db } from "@repo/database/clients";
import { type ListOptions, listOptionsSchema } from "./dal";

type ZodSchema = z.ZodType<unknown>;

// Using any here because Drizzle's type system is complex and we need to maintain flexibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DrizzleSelect = PgSelect<any, any, any, any>;

type JoinConfig = {
  table: PgTable;
  condition: SQL<unknown>;
};

type ListWithJoinsResult<TSchema extends ZodSchema> = {
  rows: z.infer<TSchema>[];
  count: number;
  limit?: number;
  offset?: number;
};

export function createListWithJoins<TSchema extends ZodSchema>(
  table: AnyPgTable,
  _schema: TSchema,
  joins: JoinConfig[]
): (options?: ListOptions) => Promise<ListWithJoinsResult<TSchema>> {
  return async (options: ListOptions = {}): Promise<ListWithJoinsResult<TSchema>> => {
    const parsedOptions = await listOptionsSchema.safeParseAsync(options);
    if (!parsedOptions.success) throw new Error("Invalid options");

    const { filters, search, searchColumns, orderBy } = parsedOptions.data;

    // Create the base query with joins
    let query: DrizzleSelect = db.select().from(table).$dynamic();

    // Apply joins
    for (const join of joins) {
      query = query.innerJoin(join.table, join.condition) as DrizzleSelect;
    }

    // Create a count query for pagination
    let countQuery: DrizzleSelect = db.select({ count: count() }).from(table).$dynamic();

    // Apply the same joins to the count query
    for (const join of joins) {
      countQuery = countQuery.innerJoin(join.table, join.condition) as DrizzleSelect;
    }

    // Apply filters if provided
    const filterConditions: SQL<unknown>[] = [];
    if (filters) {
      for (const filter of filters) {
        const filterColumnParts = filter.column.split(":");
        const [filterTable, filterColumn] = filterColumnParts;
        let column: PgColumn | undefined;

        if (filterColumnParts.length > 1 && filterTable && filterColumn) {
          // Filter on joined table (e.g., "organizations:name")
          const join = joins.find((j) => getTableName(j.table) === filterTable);
          if (join) {
            column = getTableColumns(join.table)[filterColumn];
          }
        } else {
          // Filter on main table
          column = getTableColumns(table)[filter.column];
        }

        if (!column) {
          continue;
        }

        if (filter.operator === "=" || filter.operator === "eq") {
          filterConditions.push(eq(column, filter.value));
        }
      }
    }

    // Apply search filters if provided
    const searchConditions: SQL<unknown>[] = [];
    if (search && searchColumns) {
      for (const searchColumn of searchColumns) {
        const columns: PgColumn[] = [];

        // Check main table
        const mainTableColumns = getTableColumns(table);
        if (searchColumn in mainTableColumns) {
          const column = mainTableColumns[searchColumn as keyof typeof mainTableColumns];
          if (column) {
            columns.push(column);
          }
        }

        // Check joined tables
        for (const join of joins) {
          const joinTableColumns = getTableColumns(join.table);
          if (searchColumn in joinTableColumns) {
            const column = joinTableColumns[searchColumn as keyof typeof joinTableColumns];
            if (column) {
              columns.push(column);
            }
          }
        }

        // Add search condition for each matching column
        for (const column of columns) {
          const searchCondition = ilike(column, `%${search}%`);
          searchConditions.push(searchCondition);
        }
      }
    }

    // Combine search and filter conditions
    const allConditions: SQL<unknown>[] = [];

    // Add search conditions (OR logic for search)
    if (searchConditions.length > 0) {
      const searchCondition = or(...searchConditions);
      if (searchCondition) {
        allConditions.push(searchCondition);
      }
    }

    // Add filter conditions (AND logic for filters)
    if (filterConditions.length > 0) {
      allConditions.push(...filterConditions);
    }

    // Apply all conditions
    if (allConditions.length > 0) {
      const finalCondition = allConditions.length === 1 ? allConditions[0] : and(...allConditions);
      query = query.where(finalCondition) as DrizzleSelect;
      countQuery = countQuery.where(finalCondition) as DrizzleSelect;
    }

    // Apply order by if provided
    if (orderBy && orderBy.length > 0) {
      for (const order of orderBy) {
        const orderColumnParts = order.column.split(":");
        const [orderTable, orderColumn] = orderColumnParts;
        if (orderColumnParts.length > 1 && orderTable && orderColumn) {
          const join = joins.find((j) => getTableName(j.table) === orderTable);
          if (join) {
            const column = getTableColumns(join.table)[orderColumn];
            if (column) {
              query =
                order.direction === "desc"
                  ? (query.orderBy(desc(column)) as DrizzleSelect)
                  : (query.orderBy(asc(column)) as DrizzleSelect);
            }
          }
        } else {
          const orderByColumn = getTableColumns(table)[order.column];
          if (orderByColumn) {
            query =
              order.direction === "desc"
                ? (query.orderBy(desc(orderByColumn)) as DrizzleSelect)
                : (query.orderBy(asc(orderByColumn)) as DrizzleSelect);
          }
        }
      }
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit) as DrizzleSelect;
    }

    if (options.offset) {
      query = query.offset(options.offset) as DrizzleSelect;
    }

    const [rows, countResult] = await Promise.all([query, countQuery]);

    // Transform the result to properly embed joined table data
    const transformedRows = rows.map((row) => {
      const result: Record<string, unknown> = {};
      const joinedData: Record<string, Record<string, unknown>> = {};

      // Process each property in the row
      for (const [key, value] of Object.entries(row)) {
        if (value && typeof value === "object" && value !== null) {
          // If the value is an object (from a joined table), collect it
          joinedData[key] = { ...value };
        } else if (value !== undefined) {
          // If it's a direct property, add it to the main result
          result[key] = value;
        }
      }

      // Add joined data to the result - keep all as nested objects
      for (const [joinKey, joinValue] of Object.entries(joinedData)) {
        result[joinKey] = joinValue;
      }

      return result;
    });

    // Ensure we always return a valid result, even if there was an error
    const countValue = countResult[0] ? Number((countResult[0] as { count: number }).count) : 0;
    const result: ListWithJoinsResult<TSchema> = {
      rows: transformedRows as z.infer<TSchema>[],
      count: countValue,
      limit: options.limit,
      offset: options.offset,
    };

    return result;
  };
}
