import "server-only";
import { requireAdminSession, requireSession } from "@/lib/auth/session";

/**
 * Gets the current session or throws ServerActionNotAuthorizedException
 */
export async function getSessionOrThrow() {
  return requireSession();
}

/**
 * Wraps a server action with admin authorization check
 * Throws ServerActionNotAuthorizedException if user is not an admin
 */
export function withAdminAuth<TArgs extends unknown[], TReturn>(fn: (...args: TArgs) => Promise<TReturn>) {
  return async (...args: TArgs): Promise<TReturn> => {
    await requireAdminSession();
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
