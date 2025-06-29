"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Terminal } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Locale } from "@/i18n/config";
import { forgetPassword } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { ForgotPasswordFormData, ForgotPasswordSchema } from "./schema";

export function ForgotPasswordForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const locale = useLocale() as Locale;
  const t = useTranslations();
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const handleSubmit = async (values: ForgotPasswordFormData) => {
    await forgetPassword({
      email: values.email,
      redirectTo: "/auth/reset-password",
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Alert className="mb-4" variant="default">
        <Terminal className="h-4 w-4" />
        <AlertTitle>{t("forgotPassword.messages.success.title")}</AlertTitle>
        <AlertDescription>
          {t("forgotPassword.messages.success.description")}
          <br />
          <Link href="/auth/login" className="mt-2 inline-block text-sm underline">
            {t("forgotPassword.links.login")}
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl">{t("forgotPassword.title")}</CardTitle>
            <LocaleSwitcher defaultValue={locale} />
          </div>
          <CardDescription>{t("forgotPassword.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form data-testid="auth.forgot-password.form" onSubmit={form.handleSubmit(handleSubmit)}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("forgotPassword.form.email")}</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            autoComplete="email"
                            {...field}
                            data-testid="auth.forgot-password.form.email"
                            placeholder="name@example.com"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full cursor-pointer"
                  disabled={form.formState.isSubmitting}
                  data-testid="auth.forgot-password.form.submit">
                  {form.formState.isSubmitting ? t("forgotPassword.form.submitting") : t("forgotPassword.form.submit")}
                </Button>
                <div className="mt-4 text-center text-sm">
                  <Link
                    href="/auth/login"
                    className="underline underline-offset-4"
                    data-testid="auth.forgot-password.form.login">
                    {t("forgotPassword.links.login")}
                  </Link>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
