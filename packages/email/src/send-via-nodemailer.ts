import { render } from "@react-email/components";
import nodemailer from "nodemailer";
import { ReactElement } from "react";

function parseBooleanEnv(value: string | undefined) {
  if (!value) {
    return false;
  }

  const normalizedValue = value.trim().toLowerCase();

  return normalizedValue === "true" || normalizedValue === "1" || normalizedValue === "yes";
}

export async function sendViaNodeMailer({
  from,
  to,
  subject,
  text,
  react,
}: {
  from: string;
  to: string;
  subject: string;
  text: string;
  react: ReactElement;
}) {
  const smtpServerSecure = parseBooleanEnv(process.env.SMTP_SERVER_SECURE!);

  const transporter = nodemailer.createTransport({
    debug: true,
    host: process.env.SMTP_SERVER_HOST!,
    port: parseInt(process.env.SMTP_SERVER_PORT!, 10),
    auth: {
      user: process.env.SMTP_SERVER_USERNAME!,
      pass: process.env.SMTP_SERVER_PASSWORD!,
    },
    secure: smtpServerSecure,
    tls: {
      rejectUnauthorized: false,
    },
  });

  try {
    await transporter.verify();
  } catch (error) {
    console.error("SMTP connection failed:", error);
    throw error;
  }

  const html = await render(react);

  return await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}
