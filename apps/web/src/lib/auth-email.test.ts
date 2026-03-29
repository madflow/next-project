import { APIError } from "better-auth/api";
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { sendAuthEmail } from "./auth-email";

const emailOptions = {
  to: "user@example.com",
  from: "noreply@example.com",
  subject: "Test subject",
  text: "Test body",
  react: null as never,
};

describe("sendAuthEmail", () => {
  test("passes options through when email sending succeeds", async () => {
    let sentTo: string | null = null;

    await sendAuthEmail(
      emailOptions,
      {
        emailType: "organizationInvite",
      },
      {
        send: async (options) => {
          sentTo = options.to;
          return {} as Awaited<ReturnType<(typeof import("@repo/email"))["sendEmail"]>>;
        },
        captureException: () => "event-id",
      }
    );

    assert.strictEqual(sentTo, emailOptions.to);
  });

  test("captures failures and rethrows as APIError", async () => {
    const smtpError = new Error("SMTP connection failed");
    let capturedError: unknown;
    let capturedContext: unknown;

    await assert.rejects(
      () =>
        sendAuthEmail(
          emailOptions,
          {
            emailType: "organizationInvite",
            organizationId: "org-1",
            invitationId: "invite-1",
            inviterId: "user-1",
          },
          {
            send: async () => {
              throw smtpError;
            },
            captureException: (error, context) => {
              capturedError = error;
              capturedContext = context;
              return "event-id";
            },
          }
        ),
      (error) => {
        assert.ok(error instanceof APIError);
        assert.strictEqual(error.message, "Failed to send email");
        return true;
      }
    );

    assert.strictEqual(capturedError, smtpError);
    assert.deepStrictEqual(capturedContext, {
      tags: {
        area: "auth-email",
        email_type: "organizationInvite",
      },
      extra: {
        to: emailOptions.to,
        subject: emailOptions.subject,
        organizationId: "org-1",
        invitationId: "invite-1",
        inviterId: "user-1",
        userId: undefined,
      },
    });
  });
});
