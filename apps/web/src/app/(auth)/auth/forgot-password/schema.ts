import { z } from "zod";

export const ForgotPasswordSchema = z.object({
  email: z.email({ message: "Please enter a valid email address." }),
});

export type ForgotPasswordFormData = z.infer<typeof ForgotPasswordSchema>;
