import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";
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
import { USER_ADMIN_ROLE, createAuth } from "../server/index.js";

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

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }

  return ["1", "true", "yes"].includes(value.toLowerCase());
}

function getEnvConfig(overrides?: Partial<EnvConfig>): EnvConfig {
  return {
    authDisableSignup: overrides?.authDisableSignup ?? parseBoolean(process.env.AUTH_DISABLE_SIGNUP, true),
    authSecret: overrides?.authSecret ?? process.env.AUTH_SECRET ?? "",
    authUrl: overrides?.authUrl ?? process.env.AUTH_URL ?? "",
    baseUrl: overrides?.baseUrl ?? process.env.BASE_URL ?? "",
    mailDefaultSender: overrides?.mailDefaultSender ?? process.env.MAIL_DEFAULT_SENDER ?? "",
    siteName: overrides?.siteName ?? process.env.SITE_NAME ?? "",
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

export function createWebAuth({ env: envOverrides }: WebAuthOptions = {}) {
  const env = getEnvConfig(envOverrides);

  return createAuth({
    authDisableSignup: env.authDisableSignup,
    baseURL: env.authUrl,
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
    plugins: [nextCookies()],
  });
}

export const auth = createWebAuth();

export { USER_ADMIN_ROLE };
