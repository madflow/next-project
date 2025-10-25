import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin, organization as organizationPlugin } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { defaultClient as db } from "@repo/database/clients";
import { authSchema } from "@repo/database/schema";
import { sendEmail, EmailVerification, PasswordReset, EmailChange, OrganizationInvite, getEmailTranslations } from "@repo/email";
import { env } from "@/env";

export const USER_ADMIN_ROLE = "admin";
export const USER_ROLE = "user";

export const auth = betterAuth({
  telemetry: { enabled: false },
  secret: env.AUTH_SECRET,
  baseURL: env.AUTH_URL,
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
      role: {
        type: "string",
        required: true,
        defaultValue: USER_ROLE,
        input: false,
      },
      locale: {
        type: "string",
        required: false,
        input: true,
      },
    },
    deleteUser: {
      enabled: true,
    },
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async (data: {
        user: { email: string; locale?: string };
        newEmail: string;
        url: string;
      }) => {
        const { user, newEmail, url } = data;
        const { subject, heading, content, action } = getEmailTranslations("emailChange", user.locale, { newEmail });

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
            locale: user.locale,
          }),
        });
      },
    },
  },
  rateLimit: {
    storage: "database",
    enabled: true,
    window: 10,
    max: 100,
    customRules: {
      "/sign-in/email": {
        window: 10,
        max: 25,
      },
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async (data: { user: { email: string; locale?: string }; url: string }) => {
      const { user, url } = data;
      const { subject, heading, content, action } = getEmailTranslations("emailVerification", user.locale);
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
          locale: user.locale,
        }),
      });
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    disableSignUp: false, // this needs to stay false, when private signup via invitation should work
    sendResetPassword: async (data: { user: { email: string; locale?: string }; url: string }) => {
      const { user, url } = data;
      const { subject, heading, content, action } = getEmailTranslations("passwordReset", user.locale);
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
          locale: user.locale,
        }),
      });
    },
  },
  plugins: [
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
      async sendInvitationEmail(data) {
        const inviter = await db
          .select()
          .from(authSchema.user)
          .where(eq(authSchema.user.id, data.invitation.inviterId))
          .limit(1);
        const inviterLocale = inviter[0]?.locale ?? undefined;

        const inviteLink = `${env.BASE_URL}/auth/accept-invitation/${data.invitation.id}`;
        const { subject, heading, content, action } = getEmailTranslations("organizationInvite", inviterLocale, {
          organizationName: data.organization.name,
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
            baseUrl: env.BASE_URL,
            siteName: env.SITE_NAME,
            locale: inviterLocale,
          }),
        });
      },
      allowUserToCreateOrganization: async () => {
        return false;
      },
    }),
    nextCookies(),
  ],
});
