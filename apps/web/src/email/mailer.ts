import "server-only";
import nodemailer from "nodemailer";
import { env } from "@/env";

const transporter = nodemailer.createTransport({
  host: env.SMTP_SERVER_HOST,
  port: parseInt(env.SMTP_SERVER_PORT, 10),
  secure: false,
  auth: {
    user: env.SMTP_SERVER_USERNAME,
    pass: env.SMTP_SERVER_PASSWORD,
  },
});

export async function sendMail({
  from,
  to,
  subject,
  text,
  html,
}: {
  from: string;
  to?: string;
  subject: string;
  text: string;
  html?: string;
}) {
  try {
    await transporter.verify();
  } catch (error) {
    console.error("There was an error sending the email", error);
    return;
  }
  const info = await transporter.sendMail({
    from,
    to: to,
    subject: subject,
    text: text,
    html: html ? html : "",
  });

  return info;
}
