import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin, organization as organizationPlugin } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { defaultClient as db } from "@repo/database/clients";
import { authSchema } from "@repo/database/schema";
import { sendMail } from "@/email/mailer";
import { getEmailMessage } from "@/email/messages";
import { renderDefaultTemplateWithProps } from "@/email/renderer";
import { env } from "@/env";

export const USER_ADMIN_ROLE = "admin";
export const USER_ROLE = "user";

export const auth = betterAuth({
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
        const { heading, content, action } = getEmailMessage("emailChange", user.locale, { newEmail });

        const html = await renderDefaultTemplateWithProps({
          heading,
          content,
          action,
          url,
        });

        await sendMail({
          to: user.email,
          from: env.MAIL_DEFAULT_SENDER,
          subject: heading,
          text: `${content}\n\n${action}: ${url}`,
          html,
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
      const { heading, content, action } = getEmailMessage("emailVerification", user.locale);
      const html = await renderDefaultTemplateWithProps({
        heading,
        content,
        action,
        url,
      });
      await sendMail({
        to: user.email,
        from: env.MAIL_DEFAULT_SENDER,
        subject: heading,
        text: `${content}\n\n${action}: ${url}`,
        html,
      });
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    disableSignUp: false, // this needs to stay false, when private signup via invitation should work
    sendResetPassword: async (data: { user: { email: string; locale?: string }; url: string }) => {
      const { user, url } = data;
      const { heading, content, action } = getEmailMessage("passwordReset", user.locale);
      const html = await renderDefaultTemplateWithProps({
        heading,
        content,
        action,
        url,
      });
      await sendMail({
        to: user.email,
        from: env.MAIL_DEFAULT_SENDER,
        subject: heading,
        text: `${content}\n\n${action}: ${url}`,
        html,
      });
    },
  },
  plugins: [
    adminPlugin(),
    organizationPlugin({
      async sendInvitationEmail(data) {
        const inviteLink = `${env.BASE_URL}/auth/accept-invitation/${data.invitation.id}`;
        const { heading, content, action } = getEmailMessage("emailInvitation", "en", {
          inviteLink,
        });
        const html = await renderDefaultTemplateWithProps({
          heading,
          content,
          action,
          url: inviteLink,
        });
        await sendMail({
          to: data.invitation.email,
          from: env.MAIL_DEFAULT_SENDER,
          subject: heading,
          text: `${content}\n\n${action}: ${inviteLink}`,
          html,
        });
      },
      allowUserToCreateOrganization: async () => {
        return false;
      },
    }),
    nextCookies(),
  ],
});
