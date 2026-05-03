import "server-only";
import { SQL, and, asc, count, desc, eq, getTableColumns, ilike, or } from "drizzle-orm";
import { AnyPgColumn, AnyPgTable } from "drizzle-orm/pg-core";
import { headers } from "next/headers";
import { cache } from "react";
import { ZodType, z } from "zod";
import { defaultClient as db } from "@repo/database/clients";
import { USER_ADMIN_ROLE, auth } from "@/lib/auth";
import { DalNotAuthorizedException } from "@/lib/exception";

const orderByDirectionSchema = z.enum(["asc", "desc"]);

export const orderBySchema = z.object({
  column: z.string(),
  direction: orderByDirectionSchema,
});

export const filterSchema = z.object({
  column: z.string(),
  operator: z.string(),
  value: z.string(),
});

export const listOptionsSchema = z.object({
  limit: z.number().optional(),
  offset: z.number().optional(),
  orderBy: z.array(orderBySchema).optional(),
  search: z.string().optional(),
  searchColumns: z.array(z.string()).optional(),
  filters: z.array(filterSchema).optional(),
});

export type ListOptions = z.infer<typeof listOptionsSchema>;

type ListResult<TSchema extends z.ZodTypeAny> = {
  rows: z.infer<TSchema>[];
  count: number;
  limit?: number;
  offset?: number;
  orderBy?: z.infer<typeof orderBySchema>[];
};

type OrderClause = ReturnType<typeof asc> | ReturnType<typeof desc>;

function createListResultSchema<ItemType extends z.ZodTypeAny>(itemSchema: ItemType) {
  return z.object({
    rows: z.array(itemSchema),
    count: z.number(),
    limit: z.number(),
    offset: z.number(),
    orderBy: z.array(z.object({ column: z.string(), direction: orderByDirectionSchema })).optional(),
  });
}

function getTableColumn(table: AnyPgTable, columnName: string): AnyPgColumn | undefined {
  return (getTableColumns(table) as Record<string, AnyPgColumn>)[columnName];
}

function buildSearchConditions(table: AnyPgTable, search?: string, searchColumns?: string[]) {
  if (!search || !searchColumns?.length) {
    return [];
  }

  const escapedSearch = search.replace(/[%_]/g, "\\$&");

  return searchColumns.flatMap((searchColumn) => {
    const column = getTableColumn(table, searchColumn);
    return column ? [ilike(column, `%${escapedSearch}%`)] : [];
  });
}

function buildFilterConditions(table: AnyPgTable, filters?: ListOptions["filters"]) {
  if (!filters?.length) {
    return [];
  }

  return filters.flatMap((filter) => {
    const column = getTableColumn(table, filter.column);
    if (!column) {
      return [];
    }

    if (filter.operator === "eq" || filter.operator === "=") {
      return [eq(column, filter.value)];
    }

    return [];
  });
}

function combineWhereConditions(searchConditions: SQL<unknown>[], filterConditions: SQL<unknown>[]) {
  const conditions: SQL<unknown>[] = [];

  const searchCondition = searchConditions.length > 0 ? or(...searchConditions) : undefined;
  if (searchCondition) {
    conditions.push(searchCondition);
  }

  const filterCondition = filterConditions.length > 0 ? and(...filterConditions) : undefined;
  if (filterCondition) {
    conditions.push(filterCondition);
  }

  if (conditions.length === 0) {
    return undefined;
  }

  return conditions.length === 1 ? conditions[0] : and(...conditions);
}

function buildOrderClauses(table: AnyPgTable, orderBy?: ListOptions["orderBy"]): OrderClause[] {
  if (!orderBy?.length) {
    return [];
  }

  return orderBy.flatMap((order) => {
    const column = getTableColumn(table, order.column);
    if (!column) {
      return [];
    }

    return [order.direction === "asc" ? asc(column) : desc(column)];
  });
}

export async function getAuthenticatedClient() {
  // TODO: maybe wrap this for rls
  return db;
}

export async function getSessionUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session?.user;
}

async function assertUserHasRole(role: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user || session.user.role !== role) {
    throw new DalNotAuthorizedException("Unauthorized");
  }
}

async function assertUserHasSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    throw new DalNotAuthorizedException("Unauthorized");
  }
}

export async function assertUserIsAdmin() {
  await assertUserHasRole(USER_ADMIN_ROLE);
}

export function withAdminCheck<T extends unknown[], R>(fn: (...args: T) => Promise<R>) {
  return cache(async (...args: T): Promise<R | null> => {
    try {
      await assertUserIsAdmin();
      return await fn(...args);
    } catch (error) {
      console.error(`Error in ${fn.name}:`, error);
      throw error;
    }
  });
}

export function withSessionCheck<T extends unknown[], R>(fn: (...args: T) => Promise<R>) {
  return cache(async (...args: T): Promise<R | null> => {
    try {
      await assertUserHasSession();
      return await fn(...args);
    } catch (error) {
      console.error(`Error in ${fn.name}:`, error);
      throw error;
    }
  });
}

export function createFind<TSchema extends ZodType>(table: AnyPgTable & { id: AnyPgColumn }, schema: TSchema) {
  return async (id: string): Promise<z.infer<typeof schema> | null> => {
    const [result] = await db.select().from(table).where(eq(table.id, id)).limit(1);
    if (!result) return null;
    const parsedResult = await schema.safeParseAsync(result);
    return parsedResult.success ? parsedResult.data : null;
  };
}

export function createFindBySlug<TSchema extends ZodType>(table: AnyPgTable & { slug: AnyPgColumn }, schema: TSchema) {
  return async (slug: string): Promise<z.infer<typeof schema> | null> => {
    const [result] = await db.select().from(table).where(eq(table.slug, slug)).limit(1);
    if (!result) return null;
    const parsedResult = await schema.safeParseAsync(result);
    return parsedResult.success ? parsedResult.data : null;
  };
}

export function createList<TSchema extends z.ZodTypeAny>(table: AnyPgTable, schema: TSchema) {
  return async (options: ListOptions = {}): Promise<ListResult<TSchema>> => {
    const parsedOptions = await listOptionsSchema.safeParseAsync(options);
    if (!parsedOptions.success) throw new Error("Invalid options");

    const { filters, limit, offset, search, searchColumns, orderBy } = parsedOptions.data;

    const query = db.select().from(table);
    const countQuery = db.select({ count: count() }).from(table);

    const finalWhere = combineWhereConditions(
      buildSearchConditions(table, search, searchColumns),
      buildFilterConditions(table, filters)
    );

    if (finalWhere) {
      query.where(finalWhere);
      countQuery.where(finalWhere);
    }

    const orderClauses = buildOrderClauses(table, orderBy);
    if (orderClauses.length > 0) {
      query.orderBy(...orderClauses);
    }

    if (limit !== undefined) {
      query.limit(limit);
    }

    if (offset !== undefined) {
      query.offset(offset);
    }

    const [rows, countResult] = await Promise.all([query, countQuery]);

    const result = {
      rows,
      count: countResult[0]?.count ?? 0,
      limit,
      offset,
      orderBy,
    };

    const parsed = await createListResultSchema(schema).safeParseAsync(result);

    return parsed.success ? parsed.data : { rows: [], count: 0, limit, offset };
  };
}
