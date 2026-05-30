import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";
import { USER_ADMIN_ROLE, createAuth } from "@repo/auth/server";
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
import { defaultLocale, extractAppLocale } from "@/i18n/config";

export { USER_ADMIN_ROLE };

export const auth = createAuth({
  authDisableSignup: env.AUTH_DISABLE_SIGNUP,
  baseURL: env.AUTH_URL,
  secret: env.AUTH_SECRET,
  sendChangeEmailConfirmation: async (
    { user, newEmail, url }: { user: { email: string; locale?: string }; newEmail: string; url: string; token: string },
    request
  ) => {
    const cookieHeader = request?.headers.get("cookie");
    const requestedLocale = cookieHeader ? extractAppLocale(cookieHeader) : undefined;
    const locale = user.locale || requestedLocale || defaultLocale;
    const { subject, heading, content, action } = getEmailTranslations("emailChange", locale, { newEmail });

    await sendEmail({
      to: user.email,
      from: env.MAIL_DEFAULT_SENDER,
      subject,
      text: `${content}\n\n${action}: ${url}`,
      react: EmailChange({
        email: user.email,
        url,
        heading,
        content,
        action,
        newEmail,
        baseUrl: env.BASE_URL,
        siteName: env.SITE_NAME,
        locale,
      }),
    });
  },
  sendVerificationEmail: async (data: { user: { email: string; locale?: string }; url: string }, request) => {
    const { user, url } = data;
    const cookieHeader = request?.headers.get("cookie");
    const requestedLocale = cookieHeader ? extractAppLocale(cookieHeader) : undefined;

    const locale = user.locale || requestedLocale || defaultLocale;
    const { subject, heading, content, action } = getEmailTranslations("emailVerification", locale);
    await sendEmail({
      to: user.email,
      from: env.MAIL_DEFAULT_SENDER,
      subject,
      text: `${content}\n\n${action}: ${url}`,
      react: EmailVerification({
        email: user.email,
        url,
        heading,
        content,
        action,
        baseUrl: env.BASE_URL,
        siteName: env.SITE_NAME,
        locale,
      }),
    });
  },
  sendResetPassword: async (data: { user: { email: string; locale?: string }; url: string }, request) => {
    const { user, url } = data;
    const cookieHeader = request?.headers.get("cookie");
    const requestedLocale = cookieHeader ? extractAppLocale(cookieHeader) : undefined;
    const locale = user.locale || requestedLocale || defaultLocale;
    const { subject, heading, content, action } = getEmailTranslations("passwordReset", locale);
    await sendEmail({
      to: user.email,
      from: env.MAIL_DEFAULT_SENDER,
      subject,
      text: `${content}\n\n${action}: ${url}`,
      react: PasswordReset({
        email: user.email,
        url,
        heading,
        content,
        action,
        baseUrl: env.BASE_URL,
        siteName: env.SITE_NAME,
        locale,
      }),
    });
  },
  sendInvitationEmail: async (data, request) => {
    const inviter = (
      await db.select().from(authSchema.user).where(eq(authSchema.user.id, data.invitation.inviterId)).limit(1)
    )[0];

    const inviterLocale = inviter?.locale ?? undefined;
    const cookieHeader = request?.headers.get("cookie");
    const requestedLocale = cookieHeader ? extractAppLocale(cookieHeader) : undefined;
    const locale = inviterLocale || requestedLocale || defaultLocale;

    const inviteLink = `${env.BASE_URL}/auth/accept-invitation/${data.invitation.id}`;
    const { subject, heading, content, action } = getEmailTranslations("organizationInvite", locale, {
      organizationName: data.organization.name,
      siteName: env.SITE_NAME,
    });
    await sendEmail({
      to: data.invitation.email,
      from: env.MAIL_DEFAULT_SENDER,
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
        baseUrl: env.BASE_URL,
        siteName: env.SITE_NAME,
        locale,
      }),
    });
  },
  plugins: [nextCookies()],
});
