import "server-only";
import { headers } from "next/headers";
import { USER_ADMIN_ROLE, auth } from "@/lib/auth";
import { ServerActionNotAuthorizedException } from "@/lib/exception";

/**
 * Gets the current session or throws ServerActionNotAuthorizedException
 */
async function getSessionOrThrow() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new ServerActionNotAuthorizedException("Authentication required");
  }

  return session;
}

/**
 * Wraps a server action with admin authorization check
 * Throws ServerActionNotAuthorizedException if user is not an admin
 */
export function withAdminAuth<TArgs extends unknown[], TReturn>(fn: (...args: TArgs) => Promise<TReturn>) {
  return async (...args: TArgs): Promise<TReturn> => {
    const session = await getSessionOrThrow();

    if (session.user.role !== USER_ADMIN_ROLE) {
      throw new ServerActionNotAuthorizedException("Admin access required");
    }

    return fn(...args);
  };
}

/**
 * Wraps a server action with user authentication check
 * Throws ServerActionNotAuthorizedException if user is not authenticated
 */
export function withAuth<TArgs extends unknown[], TReturn>(fn: (...args: TArgs) => Promise<TReturn>) {
  return async (...args: TArgs): Promise<TReturn> => {
    await getSessionOrThrow();
    return fn(...args);
  };
}
