import { z } from "zod";
import { locales } from "@/i18n/config";

export const signUpSchema = z
  .object({
    email: z.string().email(),
    name: z.string(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
    locale: z.enum(locales).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignUpSchema = z.infer<typeof signUpSchema>;
