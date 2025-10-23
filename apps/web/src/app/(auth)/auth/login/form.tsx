"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Locale } from "@/i18n/config";
import { signIn } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { type LoginSchema, loginSchema } from "./schema";

type LoginFormProps = {
  signUpDisabled: boolean;
};

export function LoginForm(props: LoginFormProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations();
  const router = useRouter();

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = async (values: LoginSchema) => {
    const { email, password } = values;
    await signIn.email({
      email,
      password,
      fetchOptions: {
        onError: (error) => {
          form.setError("email", { message: error.error.message });
        },
        onSuccess: () => {
          form.reset();
          router.push("/");
        },
      },
    });
  };

  return (
    <div className={cn("flex flex-col gap-6")}>
      <Card>
        <CardHeader className="align-center flex justify-between space-y-1">
          <CardTitle className="text-2xl">{t("login.title")}</CardTitle>
          <LocaleSwitcher defaultValue={locale} />
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} data-testid="auth.login.form">
            <FieldGroup>
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="login-email">{t("login.form.email")}</FieldLabel>
                    <Input
                      id="login-email"
                      type="email"
                      aria-invalid={fieldState.invalid}
                      {...field}
                      data-testid="auth.login.form.email"
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
                    <FieldLabel htmlFor="login-password">{t("login.form.password")}</FieldLabel>
                    <Input
                      id="login-password"
                      type="password"
                      aria-invalid={fieldState.invalid}
                      {...field}
                      data-testid="auth.login.form.password"
                    />
                    <FieldDescription>
                      {t("login.links.forgotPassword.question")}{" "}
                      <Link
                        className="underline"
                        href="/auth/forgot-password"
                        data-testid="auth.login.form.forgot-password">
                        {t("login.links.forgotPassword.text")}
                      </Link>
                    </FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Button type="submit" className="w-full cursor-pointer" data-testid="auth.login.form.submit">
                {t("login.form.submit")}
              </Button>
            </FieldGroup>
            {props.signUpDisabled === false && (
              <div className="mt-4 text-center text-sm">
                {t("login.links.signUp.question")}{" "}
                <Link
                  href="/auth/sign-up"
                  className="underline underline-offset-4"
                  data-testid="auth.login.form.sign-up">
                  {t("login.links.signUp.text")}
                </Link>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
