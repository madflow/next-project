import "server-only";
import { SQL, and, asc, count, desc, eq, getTableColumns, ilike, or } from "drizzle-orm";
import { AnyPgColumn, AnyPgTable } from "drizzle-orm/pg-core";
import { headers } from "next/headers";
import { cache } from "react";
import { ZodType, z } from "zod";
import { defaultClient as db } from "@repo/database/clients";
import { USER_ADMIN_ROLE, auth } from "@/lib/auth";
import { DalNotAuthorizedException } from "@/lib/exception";

export const orderByDirectionSchema = z.enum(["asc", "desc"]);

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

export function createListResultSchema<ItemType extends z.ZodTypeAny>(itemSchema: ItemType) {
  return z.object({
    rows: z.array(itemSchema),
    count: z.number(),
    limit: z.number(),
    offset: z.number(),
    orderBy: z.array(z.object({ column: z.string(), direction: orderByDirectionSchema })).optional(),
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

export async function assertUserHasRole(role: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user || session.user.role !== role) {
    throw new DalNotAuthorizedException("Unauthorized");
  }
}

export async function assertUserHasSession() {
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

export function createList(table: AnyPgTable, schema: ZodType) {
  return async (options: ListOptions = {}): Promise<z.infer<typeof schema>> => {
    const parsedOptions = await listOptionsSchema.safeParseAsync(options);
    if (!parsedOptions.success) throw new Error("Invalid options");

    const { filters, limit, offset, search, searchColumns, orderBy } = parsedOptions.data;

    const query = db.select().from(table);
    const countQuery = db.select({ count: count() }).from(table);

    const whereOrConditions: SQL<unknown>[] = [];
    const whereAndConditions: SQL<unknown>[] = [];
    if (search && searchColumns) {
      for (const searchColumn of searchColumns) {
        let column: AnyPgColumn | undefined;
        for (const [key, o] of Object.entries(getTableColumns(table))) {
          if (key === searchColumn) {
            column = o;
            break;
          }
        }
        if (!column) {
          continue;
        }
        const escapedSearch = search.replace(/[%_]/g, "\\$&");
        whereOrConditions.push(ilike(column, `%${escapedSearch}%`));
      }
    }

    if (filters) {
      for (const filter of filters) {
        let column: AnyPgColumn | undefined;
        for (const [key, o] of Object.entries(getTableColumns(table))) {
          if (key === filter.column) {
            column = o;
            break;
          }
        }
        if (!column) {
          continue;
        }
        if (filter.operator === "eq" || filter.operator === "=") {
          whereAndConditions.push(eq(column, filter.value));
        }
      }
    }
    const whereConditions: SQL<unknown>[] = [];

    // Add OR conditions (search)
    if (whereOrConditions.length > 0) {
      const orCondition = or(...whereOrConditions);
      if (orCondition) {
        whereConditions.push(orCondition);
      }
    }

    // Add AND conditions (filters)
    if (whereAndConditions.length > 0) {
      const andCondition = and(...whereAndConditions);
      if (andCondition) {
        whereConditions.push(andCondition);
      }
    }

    // Apply all conditions at once
    if (whereConditions.length > 0) {
      const finalWhere = whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions);

      query.where(finalWhere);
      countQuery.where(finalWhere);
    }

    if (orderBy) {
      const orderClauses: (ReturnType<typeof asc> | ReturnType<typeof desc>)[] = [];

      for (const order of orderBy) {
        let column: AnyPgColumn | undefined;
        for (const [key, o] of Object.entries(getTableColumns(table))) {
          if (key === order.column) {
            column = o;
            break;
          }
        }
        if (!column) {
          continue;
        }
        if (order.direction === "asc") {
          orderClauses.push(asc(column));
        } else {
          orderClauses.push(desc(column));
        }
      }

      if (orderClauses.length > 0) {
        query.orderBy(...orderClauses);
      }
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
