"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { changePassword } from "@/lib/auth-client";

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, {
      error: "Current password is required.",
    }),
    newPassword: z.string().min(8, {
      error: "Password must be at least 8 characters.",
    }),
    confirmPassword: z.string().min(1, {
      error: "Please confirm your new password.",
    }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    error: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export function UpdatePasswordForm() {
  const t = useTranslations();

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: PasswordFormValues) => {
    await changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
      revokeOtherSessions: true,
      fetchOptions: {
        onError: () => {
          toast.error(t("account.password.error"));
        },
        onSuccess: () => {
          form.reset();
          toast.success(t("account.password.success"));
        },
      },
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-4">
        <Controller
          name="currentPassword"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>{t("account.password.fields.currentPassword")}</FieldLabel>
              <FieldGroup>
                <Input
                  {...field}
                  id={field.name}
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={fieldState.invalid}
                  data-testid="app.user.account.password.current"
                />
              </FieldGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="newPassword"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>{t("account.password.fields.newPassword")}</FieldLabel>
              <FieldGroup>
                <Input
                  {...field}
                  id={field.name}
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={fieldState.invalid}
                  data-testid="app.user.account.password.new"
                />
              </FieldGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="confirmPassword"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>{t("account.password.fields.confirmPassword")}</FieldLabel>
              <FieldGroup>
                <Input
                  {...field}
                  id={field.name}
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={fieldState.invalid}
                  data-testid="app.user.account.password.confirm"
                />
              </FieldGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <Button type="submit" className="cursor-pointer" data-testid="app.user.account.password.update">
        {t("account.password.fields.update")}
      </Button>
    </form>
  );
}
