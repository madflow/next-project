import "server-only";
import { eq } from "drizzle-orm";
import { AnyPgColumn, AnyPgTable } from "drizzle-orm/pg-core";
import { headers } from "next/headers";
import { cache } from "react";
import { ZodType, z } from "zod";
import { defaultClient as db } from "@repo/database/clients";
import { USER_ADMIN_ROLE, auth } from "@/lib/auth";
import { DalNotAuthorizedException } from "@/lib/exception";

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

async function assertUserIsAdmin() {
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
