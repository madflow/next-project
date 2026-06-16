import "server-only";
import { headers } from "next/headers";
import { isAdminUser } from "@repo/auth/server";
import type { AuthSession } from "@/lib/auth/types";
import { ServerActionNotAuthorizedException } from "@/lib/exception";
import { auth } from "./server";

export async function getSession(): Promise<AuthSession | null> {
  return (
    (await auth.api.getSession({
      headers: await headers(),
    })) ?? null
  );
}

export async function requireSession(): Promise<AuthSession> {
  const session = await getSession();

  if (!session?.user) {
    throw new ServerActionNotAuthorizedException("Authentication required");
  }

  return session;
}

export async function requireAdminSession(): Promise<AuthSession> {
  const session = await requireSession();

  if (!isAdminUser(session.user)) {
    throw new ServerActionNotAuthorizedException("Admin access required");
  }

  return session;
}

export function getActiveOrganizationId(
  session: Pick<AuthSession["session"], "activeOrganizationId"> | null | undefined
) {
  return session?.activeOrganizationId ?? null;
}
