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

function applyJoins(query: DrizzleSelect, joins: JoinConfig[]) {
  return joins.reduce((currentQuery, join) => currentQuery.innerJoin(join.table, join.condition) as DrizzleSelect, query);
}

function getTableColumn(table: PgTable | AnyPgTable, columnName: string): PgColumn | undefined {
  return (getTableColumns(table) as Record<string, PgColumn>)[columnName];
}

function resolveColumn(table: AnyPgTable, joins: JoinConfig[], reference: string): PgColumn | undefined {
  const [tableName, columnName] = reference.split(":");

  if (reference.includes(":") && tableName && columnName) {
    const joinTable = joins.find((join) => getTableName(join.table) === tableName)?.table;
    return joinTable ? getTableColumn(joinTable, columnName) : undefined;
  }

  return getTableColumn(table, reference);
}

function buildFilterConditions(table: AnyPgTable, joins: JoinConfig[], filters?: ListOptions["filters"]) {
  if (!filters?.length) {
    return [];
  }

  return filters.flatMap((filter) => {
    const column = resolveColumn(table, joins, filter.column);
    if (!column) {
      return [];
    }

    if (filter.operator === "=" || filter.operator === "eq") {
      return [eq(column, filter.value)];
    }

    return [];
  });
}

function collectSearchColumns(table: AnyPgTable, joins: JoinConfig[], searchColumn: string) {
  const columns: PgColumn[] = [];

  const mainColumn = getTableColumn(table, searchColumn);
  if (mainColumn) {
    columns.push(mainColumn);
  }

  for (const join of joins) {
    const joinedColumn = getTableColumn(join.table, searchColumn);
    if (joinedColumn) {
      columns.push(joinedColumn);
    }
  }

  return columns;
}

function buildSearchConditions(
  table: AnyPgTable,
  joins: JoinConfig[],
  search?: string,
  searchColumns?: string[]
) {
  if (!search || !searchColumns?.length) {
    return [];
  }

  return searchColumns.flatMap((searchColumn) =>
    collectSearchColumns(table, joins, searchColumn).map((column) => ilike(column, `%${search}%`))
  );
}

function buildWhereCondition(searchConditions: SQL<unknown>[], filterConditions: SQL<unknown>[]) {
  const conditions: SQL<unknown>[] = [];

  const searchCondition = searchConditions.length > 0 ? or(...searchConditions) : undefined;
  if (searchCondition) {
    conditions.push(searchCondition);
  }

  if (filterConditions.length > 0) {
    conditions.push(...filterConditions);
  }

  if (conditions.length === 0) {
    return undefined;
  }

  return conditions.length === 1 ? conditions[0] : and(...conditions);
}

function applyOrderBy(query: DrizzleSelect, table: AnyPgTable, joins: JoinConfig[], orderBy?: ListOptions["orderBy"]) {
  if (!orderBy?.length) {
    return query;
  }

  let orderedQuery = query;

  for (const order of orderBy) {
    const column = resolveColumn(table, joins, order.column);
    if (!column) {
      continue;
    }

    orderedQuery =
      order.direction === "desc"
        ? (orderedQuery.orderBy(desc(column)) as DrizzleSelect)
        : (orderedQuery.orderBy(asc(column)) as DrizzleSelect);
  }

  return orderedQuery;
}

function transformJoinedRow(row: Record<string, unknown>) {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(row)) {
    if (value === undefined) {
      continue;
    }

    result[key] = value && typeof value === "object" ? { ...(value as Record<string, unknown>) } : value;
  }

  return result;
}

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

    const { filters, limit, offset, search, searchColumns, orderBy } = parsedOptions.data;

    // Create the base query with joins
    let query: DrizzleSelect = applyJoins(db.select().from(table).$dynamic() as DrizzleSelect, joins);

    // Create a count query for pagination
    let countQuery: DrizzleSelect = applyJoins(
      db.select({ count: count() }).from(table).$dynamic() as DrizzleSelect,
      joins
    );

    const finalCondition = buildWhereCondition(
      buildSearchConditions(table, joins, search, searchColumns),
      buildFilterConditions(table, joins, filters)
    );

    if (finalCondition) {
      query = query.where(finalCondition) as DrizzleSelect;
      countQuery = countQuery.where(finalCondition) as DrizzleSelect;
    }

    query = applyOrderBy(query, table, joins, orderBy);

    // Apply pagination
    if (limit) {
      query = query.limit(limit) as DrizzleSelect;
    }

    if (offset) {
      query = query.offset(offset) as DrizzleSelect;
    }

    const [rows, countResult] = await Promise.all([query, countQuery]);

    // Transform the result to properly embed joined table data
    const transformedRows = rows.map((row) => transformJoinedRow(row as Record<string, unknown>));

    // Ensure we always return a valid result, even if there was an error
    const countValue = countResult[0] ? Number((countResult[0] as { count: number }).count) : 0;
    const result: ListWithJoinsResult<TSchema> = {
      rows: transformedRows as z.infer<TSchema>[],
      count: countValue,
      limit,
      offset,
    };

    return result;
  };
}
