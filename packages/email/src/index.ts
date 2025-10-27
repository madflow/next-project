import { sendViaNodeMailer } from "./send-via-nodemailer";
import type { SendEmailOptions } from "./types";

export async function sendEmail(options: SendEmailOptions) {
  const smtpConfigured = Boolean(process.env.SMTP_SERVER_HOST || process.env.SMTP_HOST);

  if (!smtpConfigured) {
    console.error("SMTP is not configured. Please set SMTP environment variables.");
    throw new Error("Email service not configured");
  }

  return await sendViaNodeMailer(options);
}

export * from "./templates";
export * from "./types";
export * from "./translations";
