import z from "zod";
import { type ThemeItem, organizationSettingsSchema } from "@/types/organization";

export const DEFAULT_THEME: ThemeItem = {
  name: "Default",
  chartColors: {
    "chart-1": "#3b82f6",
    "chart-2": "#ef4444",
    "chart-3": "#10b981",
    "chart-4": "#f59e0b",
    "chart-5": "#8b5cf6",
    "chart-6": "#ec4899",
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createFormSchema = (t: any) =>
  z.object({
    name: z.string().min(1, {
      error: t("organization.form.name.errors.required"),
    }),
    slug: z
      .string()
      .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, {
        error: t("organization.form.slug.errors.invalid"),
      })
      .min(1, {
        error: t("organization.form.slug.errors.required"),
      })
      .max(50, {
        error: t("organization.form.slug.errors.maxLength"),
      }),
    createdAt: z.date(),
    settings: organizationSettingsSchema.nullable(),
  });
