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
  const smtpServerSecure = parseBooleanEnv(process.env.SMTP_SERVER_SECURE || process.env.SMTP_SECURE);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_SERVER_HOST || process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_SERVER_PORT || process.env.SMTP_PORT || "587", 10),
    auth: {
      user: process.env.SMTP_SERVER_USERNAME || process.env.SMTP_USER,
      pass: process.env.SMTP_SERVER_PASSWORD || process.env.SMTP_PASSWORD,
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
