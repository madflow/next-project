import * as Sentry from "@sentry/nextjs";
import { APIError } from "better-auth/api";
import { type SendEmailOptions, sendEmail } from "@repo/email";

type AuthEmailType = "emailChange" | "emailVerification" | "organizationInvite" | "passwordReset";

type AuthEmailMetadata = {
  emailType: AuthEmailType;
  organizationId?: string;
  invitationId?: string;
  inviterId?: string;
  userId?: string;
};

type SendAuthEmailDependencies = {
  send?: typeof sendEmail;
  captureException?: typeof Sentry.captureException;
};

export async function sendAuthEmail(
  options: SendEmailOptions,
  metadata: AuthEmailMetadata,
  dependencies: SendAuthEmailDependencies = {}
) {
  const send = dependencies.send ?? sendEmail;
  const captureException = dependencies.captureException ?? Sentry.captureException;

  try {
    await send(options);
  } catch (error) {
    captureException(error, {
      tags: {
        area: "auth-email",
        email_type: metadata.emailType,
      },
      extra: {
        to: options.to,
        subject: options.subject,
        organizationId: metadata.organizationId,
        invitationId: metadata.invitationId,
        inviterId: metadata.inviterId,
        userId: metadata.userId,
      },
    });

    throw new APIError("INTERNAL_SERVER_ERROR", {
      message: "Failed to send email",
    });
  }
}
