import { eq } from "drizzle-orm";
import type { AuthInstance } from "@repo/auth/server";
import type { DatabaseInstance } from "@repo/database/clients";
import { type AuthUser, user as userTable } from "@repo/database/schema";

type SessionData = NonNullable<Awaited<ReturnType<AuthInstance["api"]["getSession"]>>>;
type VerifyApiKeyResult = Awaited<ReturnType<AuthInstance["api"]["verifyApiKey"]>>;

type ApiKeyRecord = Exclude<VerifyApiKeyResult["key"], null>;
type ApiKeyUser = Pick<AuthUser, "id" | "role">;

export type AnonymousPrincipal = {
  kind: "anonymous";
};

export type SessionPrincipal = {
  kind: "session";
  session: SessionData["session"];
  user: SessionData["user"];
};

export type ApiKeyPrincipal = {
  apiKey: ApiKeyRecord;
  kind: "api-key";
  user: ApiKeyUser;
};

export type Principal = AnonymousPrincipal | ApiKeyPrincipal | SessionPrincipal;

export const anonymousPrincipal: AnonymousPrincipal = {
  kind: "anonymous",
};

function getAPIKeyFromHeaders(headers: Headers) {
  const apiKey = headers.get("x-api-key")?.trim();
  return apiKey ? apiKey : null;
}

async function resolveAPIKeyPrincipal({
  auth,
  db,
  headers,
}: {
  auth: AuthInstance;
  db: DatabaseInstance;
  headers: Headers;
}): Promise<ApiKeyPrincipal | null> {
  const apiKey = getAPIKeyFromHeaders(headers);

  if (!apiKey) {
    return null;
  }

  const result = await auth.api.verifyApiKey({
    body: {
      key: apiKey,
    },
  });

  if (!result.valid || result.error !== null || result.key === null) {
    return null;
  }

  const [user] = await db
    .select({
      id: userTable.id,
      role: userTable.role,
    })
    .from(userTable)
    .where(eq(userTable.id, result.key.referenceId))
    .limit(1);

  if (user === undefined) {
    return null;
  }

  return {
    apiKey: result.key,
    kind: "api-key",
    user,
  };
}

async function resolveSessionPrincipal({
  auth,
  headers,
}: {
  auth: AuthInstance;
  headers: Headers;
}): Promise<SessionPrincipal | null> {
  const result = await auth.api.getSession({ headers });

  if (!result?.session || !result.user) {
    return null;
  }

  return {
    kind: "session",
    session: result.session,
    user: result.user,
  };
}

export async function resolvePrincipal({
  auth,
  db,
  headers,
}: {
  auth: AuthInstance;
  db: DatabaseInstance;
  headers: Headers;
}): Promise<Principal> {
  const apiKeyPrincipal = await resolveAPIKeyPrincipal({ auth, db, headers });

  if (apiKeyPrincipal) {
    return apiKeyPrincipal;
  }

  const sessionPrincipal = await resolveSessionPrincipal({ auth, headers });

  if (sessionPrincipal) {
    return sessionPrincipal;
  }

  return anonymousPrincipal;
}
