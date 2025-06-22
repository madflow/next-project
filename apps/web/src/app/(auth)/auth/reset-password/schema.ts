import { z } from "zod/v4";

export const ResetPasswordSchema = z.object({
  newPassword: z.string().min(8, { message: "Password must be at least 8 characters." }),
});

export type ResetPasswordFormData = z.infer<typeof ResetPasswordSchema>;
