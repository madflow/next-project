"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { env } from "@/env";
import { Locale } from "@/i18n/config";
import { signUp } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { type SignUpSchema, signUpSchema } from "./schema";

export function SignUpForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const locale = useLocale() as Locale;
  const t = useTranslations();

  const form = useForm<SignUpSchema>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      name: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof signUpSchema>) => {
    const { data, error } = await signUp.email({
      email: values.email,
      password: values.password,
      name: values.name,
      callbackURL: new URL("/auth/verify-email", env.NEXT_PUBLIC_BASE_URL).toString(),
    });

    if (error && error.message) {
      form.setError("email", { message: error.message });
    }

    if (data) {
      form.reset();
      redirect("/auth/check-email");
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">{t("signUp.title")}</CardTitle>
            <LocaleSwitcher defaultValue={locale} />
          </div>
          <CardDescription>{t("signUp.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form data-testid="auth.sign-up.form" onSubmit={form.handleSubmit(handleSubmit)}>
            <FieldGroup>
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="sign-up-email">{t("signUp.form.email")}</FieldLabel>
                    <Input
                      id="sign-up-email"
                      type="email"
                      aria-invalid={fieldState.invalid}
                      {...field}
                      data-testid="auth.sign-up.form.email"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="sign-up-name">{t("signUp.form.name")}</FieldLabel>
                    <Input
                      id="sign-up-name"
                      type="text"
                      aria-invalid={fieldState.invalid}
                      {...field}
                      data-testid="auth.sign-up.form.name"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="sign-up-password">{t("signUp.form.password")}</FieldLabel>
                    <Input
                      id="sign-up-password"
                      type="password"
                      aria-invalid={fieldState.invalid}
                      {...field}
                      data-testid="auth.sign-up.form.password"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="confirmPassword"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="sign-up-confirm-password">{t("signUp.form.confirmPassword")}</FieldLabel>
                    <Input
                      id="sign-up-confirm-password"
                      type="password"
                      aria-invalid={fieldState.invalid}
                      {...field}
                      data-testid="auth.sign-up.form.confirm-password"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Button type="submit" className="w-full cursor-pointer" data-testid="auth.sign-up.form.submit">
                {t("signUp.form.submit")}
              </Button>
            </FieldGroup>
            <div className="mt-4 text-center text-sm">
              {t("signUp.links.login.question")}{" "}
              <Link href="/auth/login" className="underline underline-offset-4" data-testid="auth.sign-up.form.login">
                {t("signUp.links.login.text")}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
