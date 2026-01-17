"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { createWithInvitation } from "@/actions/user";
import { type SignUpSchema, signUpSchema } from "@/app/(auth)/auth/sign-up/schema";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

interface SignUpFormWithInvitationProps {
  invitation: {
    id: string;
    email: string;
    organizationId: string;
    role: string | null;
  };
}

export function SignUpFormWithInvitation({ invitation }: SignUpFormWithInvitationProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations();
  const router = useRouter();

  const form = useForm<SignUpSchema>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: invitation.email,
      name: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof signUpSchema>) => {
    await createWithInvitation(invitation.id, {
      email: values.email,
      name: values.name,
      password: values.password,
    });

    form.reset();
    router.push(`/auth/check-email`);
  };

  return (
    <div className={cn("flex flex-col gap-6")}>
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex justify-between">
            <CardTitle className="text-2xl">{t("authAcceptInvitation.title")}</CardTitle>
            <LocaleSwitcher defaultValue={locale} />
          </div>
          <CardDescription>{t("authAcceptInvitation.needToSignUp")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form data-testid="auth.sign-up-with-invitation.form" onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="email">{t("signUp.form.email")}</FieldLabel>
                      <FieldGroup>
                        <Input
                          id="email"
                          disabled
                          type="email"
                          aria-invalid={fieldState.invalid}
                          {...field}
                          data-testid="auth.sign-up.form.email"
                          readOnly
                        />
                      </FieldGroup>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>
              <div className="grid gap-2">
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="name">{t("signUp.form.name")}</FieldLabel>
                      <FieldGroup>
                        <Input
                          id="name"
                          type="text"
                          aria-invalid={fieldState.invalid}
                          {...field}
                          data-testid="auth.sign-up.form.name"
                        />
                      </FieldGroup>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>
              <div className="grid gap-2">
                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="password">{t("signUp.form.password")}</FieldLabel>
                      <FieldGroup>
                        <Input
                          id="password"
                          type="password"
                          aria-invalid={fieldState.invalid}
                          {...field}
                          data-testid="auth.sign-up.form.password"
                        />
                      </FieldGroup>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>
              <div className="grid gap-2">
                <Controller
                  name="confirmPassword"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="confirmPassword">{t("signUp.form.confirmPassword")}</FieldLabel>
                      <FieldGroup>
                        <Input
                          id="confirmPassword"
                          type="password"
                          aria-invalid={fieldState.invalid}
                          {...field}
                          data-testid="auth.sign-up.form.confirm-password"
                        />
                      </FieldGroup>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>
              <Button type="submit" className="w-full cursor-pointer" data-testid="auth.sign-up.form.submit">
                {t("signUp.form.submit")}
              </Button>
            </div>
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
