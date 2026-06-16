import { apiKey } from "@better-auth/api-key";
import { type BetterAuthOptions, type BetterAuthPlugin, betterAuth } from "better-auth";
import { admin as adminPlugin, organization as organizationPlugin } from "better-auth/plugins";
import { AUTH_COOKIE_PREFIX, authSessionAdditionalFields, authUserAdditionalFields } from "../shared";

type EmailChangeUser = {
  email: string;
  locale?: string;
};

type SendChangeEmailConfirmation = (
  data: { newEmail: string; token: string; url: string; user: EmailChangeUser },
  request?: Request
) => Promise<void>;

type SendVerificationEmail = (data: { url: string; user: EmailChangeUser }, request?: Request) => Promise<void>;
type SendResetPassword = (data: { url: string; user: EmailChangeUser }, request?: Request) => Promise<void>;
type SendInvitationEmail = (
  data: {
    invitation: {
      email: string;
      id: string;
      inviterId: string;
    };
    organization: {
      name: string;
    };
  },
  request?: Request
) => Promise<void>;

type BaseCreateAuthOptions = {
  authDisableSignup?: boolean;
  baseURL?: string;
  cookiePrefix?: string;
  database: BetterAuthOptions["database"];
  databaseHooks?: BetterAuthOptions["databaseHooks"];
  secret?: string;
  sendChangeEmailConfirmation?: SendChangeEmailConfirmation;
  sendInvitationEmail?: SendInvitationEmail;
  sendResetPassword?: SendResetPassword;
  sendVerificationEmail?: SendVerificationEmail;
};

export type CreateAuthOptions = BaseCreateAuthOptions & {
  serverPlugins?: BetterAuthPlugin[];
};

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }

  return ["1", "true", "yes"].includes(value.toLowerCase());
}

function createAPIKeyPlugin() {
  return apiKey({
    references: "user",
    defaultPrefix: "uak_",
    enableMetadata: true,
    rateLimit: {
      enabled: true,
      maxRequests: 300,
      timeWindow: 60 * 1000,
    },
  });
}

function createAdminPlugin() {
  return adminPlugin();
}

function createOrganizationPlugin(sendInvitationEmail?: SendInvitationEmail) {
  return organizationPlugin({
    schema: {
      organization: {
        additionalFields: {
          settings: {
            type: "string",
            required: false,
            input: false,
          },
        },
      },
    },
    ...(sendInvitationEmail ? { sendInvitationEmail } : {}),
    allowUserToCreateOrganization: async () => {
      return false;
    },
  });
}

export function createAuth({
  authDisableSignup = parseBoolean(process.env.AUTH_DISABLE_SIGNUP, true),
  baseURL = process.env.AUTH_URL ?? "",
  cookiePrefix = AUTH_COOKIE_PREFIX,
  database,
  databaseHooks,
  secret = process.env.AUTH_SECRET ?? "",
  sendChangeEmailConfirmation,
  sendInvitationEmail,
  sendResetPassword,
  sendVerificationEmail,
  serverPlugins,
}: CreateAuthOptions) {
  return betterAuth({
    telemetry: { enabled: false },
    secret,
    baseURL,
    database,
    ...(databaseHooks ? { databaseHooks } : {}),
    session: {
      additionalFields: authSessionAdditionalFields,
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,
      },
    },
    advanced: {
      cookiePrefix,
      database: {
        generateId: false,
      },
    },
    user: {
      additionalFields: authUserAdditionalFields,
      deleteUser: {
        enabled: true,
      },
      changeEmail: {
        enabled: true,
        ...(sendChangeEmailConfirmation ? { sendChangeEmailConfirmation } : {}),
      },
    },
    rateLimit: {
      storage: "database",
      enabled: true,
      window: 60,
      max: 2000,
      modelName: "rateLimit",
      customRules: {
        "/reset-password/email": {
          window: 60,
          max: 10,
        },
        "/sign-in/email": {
          window: 60,
          max: 400,
        },
        "/sign-up/email": {
          window: 60,
          max: 10,
        },
      },
    },
    emailVerification: {
      sendOnSignUp: !authDisableSignup,
      sendOnSignIn: false,
      autoSignInAfterVerification: false,
      ...(sendVerificationEmail ? { sendVerificationEmail } : {}),
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: !authDisableSignup,
      disableSignUp: false,
      autoSignIn: false,
      ...(sendResetPassword ? { sendResetPassword } : {}),
    },
    plugins: [
      createAPIKeyPlugin(),
      createAdminPlugin(),
      createOrganizationPlugin(sendInvitationEmail),
      ...(serverPlugins ?? []),
    ],
  });
}

export type AuthInstance = ReturnType<typeof createAuth>;
export type AuthSessionResult = Awaited<ReturnType<AuthInstance["api"]["getSession"]>>;
export type AuthSession = NonNullable<AuthSessionResult>;
export type AuthSessionData = AuthSession["session"];
export type AuthUser = AuthSession["user"];
export type AuthVerifyApiKeyResult = Awaited<ReturnType<AuthInstance["api"]["verifyApiKey"]>>;

export type InferAuthSession<TAuth extends { api: { getSession: (...args: never[]) => Promise<unknown> } }> =
  NonNullable<Awaited<ReturnType<TAuth["api"]["getSession"]>>>;

export type InferAuthSessionData<TAuth extends { api: { getSession: (...args: never[]) => Promise<unknown> } }> =
  InferAuthSession<TAuth>["session"];

export type InferAuthUser<TAuth extends { api: { getSession: (...args: never[]) => Promise<unknown> } }> =
  InferAuthSession<TAuth>["user"];

export type PrincipalAuth = {
  api: Pick<AuthInstance["api"], "getSession" | "verifyApiKey">;
};

export type RouteHandlerAuth = Pick<AuthInstance, "handler">;
export {
  AUTH_COOKIE_PREFIX,
  USER_ADMIN_ROLE,
  getImpersonatedBy,
  isAdminRole,
  isAdminUser,
  isImpersonatingSession,
} from "../shared";
export type { AuthRole } from "../shared";
