import type { AuthInstance } from "@repo/auth/server";
import {
  type ApiKeyPrincipal,
  type Principal,
  type SessionPrincipal,
  anonymousPrincipal,
} from "../server/auth/principal";
import type { ProcedureContextInput } from "../server/base";

type SessionData = NonNullable<Awaited<ReturnType<AuthInstance["api"]["getSession"]>>>;
type VerifyApiKeyResult = Awaited<ReturnType<AuthInstance["api"]["verifyApiKey"]>>;

const adminUserId = "550e8400-e29b-41d4-a716-446655440001";
const userUserId = "550e8400-e29b-41d4-a716-446655440010";

export const adminSessionData = {
  session: {
    activeOrganizationId: null,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    expiresAt: new Date("2024-01-08T00:00:00.000Z"),
    id: "550e8400-e29b-41d4-a716-446655440100",
    impersonatedBy: null,
    ipAddress: null,
    token: "admin-session-token",
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    userAgent: null,
    userId: adminUserId,
  },
  user: {
    banExpires: null,
    banReason: null,
    banned: null,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    email: "admin@example.com",
    emailVerified: true,
    id: adminUserId,
    image: null,
    locale: "en",
    name: "Admin User",
    role: "admin",
    updatedAt: new Date("2024-01-02T00:00:00.000Z"),
  },
} as SessionData;

export const userSessionData = {
  session: {
    ...adminSessionData.session,
    id: "550e8400-e29b-41d4-a716-446655440101",
    token: "user-session-token",
    userId: userUserId,
  },
  user: {
    ...adminSessionData.user,
    email: "user@example.com",
    id: userUserId,
    name: "Regular User",
    role: "user",
  },
} as SessionData;

export const invalidApiKeyResult = {
  error: {
    code: "INVALID_API_KEY",
    message: "Invalid API key",
  },
  key: null,
  valid: false,
} as VerifyApiKeyResult;

export const adminApiKeyResult = {
  error: null,
  key: {
    configId: "default",
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    enabled: true,
    expiresAt: null,
    id: "550e8400-e29b-41d4-a716-446655440200",
    key: "hashed-admin-api-key",
    lastRefillAt: null,
    lastRequest: null,
    metadata: null,
    name: "Admin API Key",
    permissions: null,
    prefix: "uak_",
    rateLimitEnabled: true,
    rateLimitMax: 300,
    rateLimitTimeWindow: 60000,
    referenceId: adminUserId,
    refillAmount: null,
    refillInterval: null,
    remaining: null,
    requestCount: 0,
    start: "uak_",
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  },
  valid: true,
} as VerifyApiKeyResult;

const adminSessionPrincipal: SessionPrincipal = {
  kind: "session",
  session: adminSessionData.session,
  user: adminSessionData.user,
};

const userSessionPrincipal: SessionPrincipal = {
  kind: "session",
  session: userSessionData.session,
  user: userSessionData.user,
};

const adminApiKeyPrincipal: ApiKeyPrincipal = {
  apiKey: adminApiKeyResult.key!,
  kind: "api-key",
  user: {
    id: adminSessionData.user.id,
    role: adminSessionData.user.role,
  },
};

export function createMockAuth({
  apiKeyResult = invalidApiKeyResult,
  session = null,
}: {
  apiKeyResult?: VerifyApiKeyResult;
  session?: Awaited<ReturnType<AuthInstance["api"]["getSession"]>>;
} = {}): AuthInstance {
  return {
    api: {
      getSession: async () => session,
      verifyApiKey: async () => apiKeyResult,
    },
  } as AuthInstance;
}

function createProcedureContext(db: ProcedureContextInput["db"], principal: Principal): ProcedureContextInput {
  return {
    db,
    principal,
  };
}

export function createAdminProcedureContext(db: ProcedureContextInput["db"]) {
  return createProcedureContext(db, adminSessionPrincipal);
}

export function createAdminAPIKeyProcedureContext(db: ProcedureContextInput["db"]) {
  return createProcedureContext(db, adminApiKeyPrincipal);
}

export function createAnonymousProcedureContext(db: ProcedureContextInput["db"]) {
  return createProcedureContext(db, anonymousPrincipal);
}

export function createUserProcedureContext(db: ProcedureContextInput["db"]) {
  return createProcedureContext(db, userSessionPrincipal);
}
