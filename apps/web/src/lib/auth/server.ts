import "server-only";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";
import { createAuth } from "@repo/auth/server";
import { defaultClient as db } from "@repo/database/clients";
import { authSchema } from "@repo/database/schema";
import {
  EmailChange,
  EmailVerification,
  OrganizationInvite,
  PasswordReset,
  getEmailTranslations,
  sendEmail,
} from "@repo/email";
import { env } from "@/env";

type Locale = "en" | "de";

const APP_LOCALE_COOKIE = "APP_LOCALE";
const DEFAULT_LOCALE: Locale = "en";

type EnvConfig = {
  authDisableSignup: boolean;
  authSecret: string;
  authUrl: string;
  baseUrl: string;
  mailDefaultSender: string;
  siteName: string;
};

type WebAuthOptions = {
  env?: Partial<EnvConfig>;
};

function getEnvConfig(overrides?: Partial<EnvConfig>): EnvConfig {
  return {
    authDisableSignup: overrides?.authDisableSignup ?? env.AUTH_DISABLE_SIGNUP,
    authSecret: overrides?.authSecret ?? env.AUTH_SECRET,
    authUrl: overrides?.authUrl ?? env.AUTH_URL,
    baseUrl: overrides?.baseUrl ?? env.BASE_URL,
    mailDefaultSender: overrides?.mailDefaultSender ?? env.MAIL_DEFAULT_SENDER,
    siteName: overrides?.siteName ?? env.SITE_NAME,
  };
}

function extractAppLocale(cookieHeader: string): Locale | undefined {
  const pairs = cookieHeader.split(";").map((pair) => pair.trim());

  for (const pair of pairs) {
    if (pair.startsWith(`${APP_LOCALE_COOKIE}=`)) {
      const locale = pair.split("=")[1];

      if (locale === "de" || locale === "en") {
        return locale;
      }
    }
  }

  return undefined;
}

function resolveRequestLocale(request: Request | undefined, userLocale?: string): Locale {
  const cookieHeader = request?.headers.get("cookie");
  const requestedLocale = cookieHeader ? extractAppLocale(cookieHeader) : undefined;

  if (userLocale === "de" || userLocale === "en") {
    return userLocale;
  }

  return requestedLocale ?? DEFAULT_LOCALE;
}

function createWebAuth({ env: envOverrides }: WebAuthOptions = {}) {
  const env = getEnvConfig(envOverrides);

  return createAuth({
    authDisableSignup: env.authDisableSignup,
    baseURL: env.authUrl,
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: authSchema,
    }),
    databaseHooks: {
      user: {
        create: {
          after: async () => {
            // Placeholder for invitation-aware signup hooks.
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
            const singleMembership = memberships.length === 1 ? memberships[0] : null;

            return {
              data: {
                ...session,
                activeOrganizationId: singleMembership?.organizationId ?? null,
              },
            };
          },
        },
      },
    },
    secret: env.authSecret,
    sendChangeEmailConfirmation: async ({ user, newEmail, url }, request) => {
      const locale = resolveRequestLocale(request, user.locale);
      const { subject, heading, content, action } = getEmailTranslations("emailChange", locale, { newEmail });

      await sendEmail({
        to: user.email,
        from: env.mailDefaultSender,
        subject,
        text: `${content}\n\n${action}: ${url}`,
        react: EmailChange({
          email: user.email,
          url,
          heading,
          content,
          action,
          newEmail,
          baseUrl: env.baseUrl,
          siteName: env.siteName,
          locale,
        }),
      });
    },
    sendVerificationEmail: async ({ user, url }, request) => {
      const locale = resolveRequestLocale(request, user.locale);
      const { subject, heading, content, action } = getEmailTranslations("emailVerification", locale);

      await sendEmail({
        to: user.email,
        from: env.mailDefaultSender,
        subject,
        text: `${content}\n\n${action}: ${url}`,
        react: EmailVerification({
          email: user.email,
          url,
          heading,
          content,
          action,
          baseUrl: env.baseUrl,
          siteName: env.siteName,
          locale,
        }),
      });
    },
    sendResetPassword: async ({ user, url }, request) => {
      const locale = resolveRequestLocale(request, user.locale);
      const { subject, heading, content, action } = getEmailTranslations("passwordReset", locale);

      await sendEmail({
        to: user.email,
        from: env.mailDefaultSender,
        subject,
        text: `${content}\n\n${action}: ${url}`,
        react: PasswordReset({
          email: user.email,
          url,
          heading,
          content,
          action,
          baseUrl: env.baseUrl,
          siteName: env.siteName,
          locale,
        }),
      });
    },
    sendInvitationEmail: async (data, request) => {
      const inviter = (
        await db.select().from(authSchema.user).where(eq(authSchema.user.id, data.invitation.inviterId)).limit(1)
      )[0];

      const locale = resolveRequestLocale(request, inviter?.locale ?? undefined);
      const inviteLink = `${env.baseUrl}/auth/accept-invitation/${data.invitation.id}`;
      const { subject, heading, content, action } = getEmailTranslations("organizationInvite", locale, {
        organizationName: data.organization.name,
        siteName: env.siteName,
      });

      await sendEmail({
        to: data.invitation.email,
        from: env.mailDefaultSender,
        subject,
        text: `${content}\n\n${action}: ${inviteLink}`,
        react: OrganizationInvite({
          email: data.invitation.email,
          url: inviteLink,
          heading,
          content,
          action,
          organizationName: data.organization.name,
          inviterName: inviter?.name,
          inviterEmail: inviter?.email,
          baseUrl: env.baseUrl,
          siteName: env.siteName,
          locale,
        }),
      });
    },
    serverPlugins: [nextCookies()],
  });
}

export const auth = createWebAuth();
