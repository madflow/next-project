import { apiKey } from "@better-auth/api-key";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin, organization as organizationPlugin } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { defaultClient as db } from "@repo/database/clients";
import { authSchema } from "@repo/database/schema";

export const USER_ADMIN_ROLE = "admin";
const USER_ROLE = "user";

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

export type CreateAuthOptions = {
  authDisableSignup?: boolean;
  baseURL?: string;
  secret?: string;
  sendChangeEmailConfirmation?: SendChangeEmailConfirmation;
  sendInvitationEmail?: SendInvitationEmail;
  sendResetPassword?: SendResetPassword;
  sendVerificationEmail?: SendVerificationEmail;
};

export function createAuth({
  authDisableSignup = process.env.AUTH_DISABLE_SIGNUP === undefined
    ? true
    : ["1", "true", "yes"].includes(process.env.AUTH_DISABLE_SIGNUP.toLowerCase()),
  baseURL = process.env.AUTH_URL ?? "",
  secret = process.env.AUTH_SECRET ?? "",
  sendChangeEmailConfirmation,
  sendInvitationEmail,
  sendResetPassword,
  sendVerificationEmail,
}: CreateAuthOptions = {}) {
  return betterAuth({
    telemetry: { enabled: false },
    secret,
    baseURL,
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: authSchema,
    }),
    databaseHooks: {
      user: {
        create: {
          after: async () => {
            // Check for invitation ID in headers to auto-accept invitation
            // This would be set during signup with invitation
          },
        },
      },
      session: {
        create: {
          before: async (session) => {
            const memberships = await db
              .select()
              .from(authSchema.member)
              .where(eq(authSchema.member.userId, session.userId));
            const singleMembership = memberships.length === 1 && memberships[0];
            const activeOrganizationId = singleMembership ? singleMembership.organizationId : null;

            return {
              data: {
                ...session,
                activeOrganizationId,
              },
            };
          },
        },
      },
    },
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,
      },
    },
    advanced: {
      cookiePrefix: "auth",
      database: {
        generateId: false,
      },
    },
    user: {
      additionalFields: {
        locale: {
          type: "string",
          required: false,
          input: true,
        },
        role: {
          type: "string",
          required: true,
          defaultValue: USER_ROLE,
          input: false,
        },
      },
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
      apiKey({
        references: "user",
        defaultPrefix: "uak_",
        enableMetadata: true,
        rateLimit: {
          enabled: true,
          maxRequests: 300,
          timeWindow: 60 * 1000,
        },
      }),
      adminPlugin(),
      organizationPlugin({
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
      }),
      nextCookies(),
    ],
  });
}

export type AuthInstance = ReturnType<typeof createAuth>;
