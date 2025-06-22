import "server-only";
import { SQL, asc, count, desc, eq, getTableColumns, ilike, or } from "drizzle-orm";
import { AnyPgColumn, AnyPgTable } from "drizzle-orm/pg-core";
import { headers } from "next/headers";
import { cache } from "react";
import { ZodSchema, z } from "zod/v4";
import { defaultClient as db } from "@repo/database/clients";
import { USER_ADMIN_ROLE, auth } from "./auth";
import { DalNotAuthorizedException } from "./exception";

export const orderBySchema = z.object({
  column: z.string(),
  direction: z.enum(["asc", "desc"]),
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
    orderBy: z.array(z.object({ column: z.string(), direction: z.enum(["asc", "desc"]) })).optional(),
  });
}

export async function assertUserHasRole(role: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user || session.user.role !== role) {
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
export function createFind<TSchema extends ZodSchema>(table: AnyPgTable & { id: AnyPgColumn }, schema: TSchema) {
  return async (id: string): Promise<z.infer<typeof schema> | null> => {
    const [result] = await db.select().from(table).where(eq(table.id, id)).limit(1);
    if (!result) return null;
    const parsedResult = await schema.safeParseAsync(result);
    return parsedResult.success ? parsedResult.data : null;
  };
}

export function createList(table: AnyPgTable, schema: ZodSchema) {
  return async (options: ListOptions = {}): Promise<z.infer<typeof schema>> => {
    const parsedOptions = await listOptionsSchema.safeParseAsync(options);
    if (!parsedOptions.success) throw new Error("Invalid options");

    const { limit, offset, search, searchColumns, orderBy } = parsedOptions.data;

    const query = db.select().from(table);
    const countQuery = db.select({ count: count() }).from(table);

    const whereConditions: SQL<unknown>[] = [];
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
          console.warn(`Unknown search column: ${searchColumn}`);
          continue;
        }
        whereConditions.push(ilike(column, `%${search}%`));
      }
    }

    if (whereConditions.length > 0) {
      query.where(or(...whereConditions));
      countQuery.where(or(...whereConditions));
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
          console.warn(`Unknown orderBy column: ${order.column}`);
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
