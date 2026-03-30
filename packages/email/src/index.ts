import { sendViaNodeMailer } from "./send-via-nodemailer";
import type { SendEmailOptions } from "./types";

export async function sendEmail(options: SendEmailOptions) {
  return await sendViaNodeMailer(options);
}

export * from "./templates";
export * from "./types";
export * from "./translations";
