import { render } from "@react-email/components";
import nodemailer from "nodemailer";
import { ReactElement } from "react";

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
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_SERVER_HOST || process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_SERVER_PORT || process.env.SMTP_PORT || "587", 10),
    auth: {
      user: process.env.SMTP_SERVER_USERNAME || process.env.SMTP_USER,
      pass: process.env.SMTP_SERVER_PASSWORD || process.env.SMTP_PASSWORD,
    },
    secure: false,
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
