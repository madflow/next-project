import "server-only";
import { headers } from "next/headers";
import { cache } from "react";
import { defaultClient as db } from "@repo/database/clients";
import { USER_ADMIN_ROLE, auth } from "@/lib/auth";
import { DalNotAuthorizedException } from "@/lib/exception";

export async function getAuthenticatedClient() {
  // TODO: maybe wrap this for rls
  return db;
}

async function assertUserHasRole(role: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user || session.user.role !== role) {
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
