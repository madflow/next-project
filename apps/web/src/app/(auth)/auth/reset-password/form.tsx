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
import { resetPassword } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { ResetPasswordFormData, ResetPasswordSchema } from "./schema";

export function ResetPasswordForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const locale = useLocale() as Locale;
  const t = useTranslations();

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { newPassword: "" },
  });

  const handleSubmit = async (values: ResetPasswordFormData) => {
    setError(null);
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setError("Missing or invalid reset token.");
      return;
    }
    await resetPassword({
      newPassword: values.newPassword,
      token,
      fetchOptions: {
        onError: (error) => {
          setError(error.error?.message || "An error occurred. Please try again.");
        },
        onSuccess: () => {
          setError(null);
          setSubmitted(true);
        },
      },
    });
  };

  if (submitted) {
    return (
      <Alert className="mb-4" variant="default">
        <Terminal className="h-4 w-4" />
        <AlertTitle>{t("resetPassword.messages.success.title")}</AlertTitle>
        <AlertDescription>
          {t("resetPassword.messages.success.description")}
          <Link href="/auth/login" className="underline">
            {t("resetPassword.links.login")}
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex justify-between">
            <CardTitle className="text-2xl">{t("resetPassword.title")}</CardTitle>
            <LocaleSwitcher defaultValue={locale} />
          </div>
          <CardDescription>{t("resetPassword.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form data-testid="auth.reset-password.form" onSubmit={form.handleSubmit(handleSubmit)}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("resetPassword.form.newPassword")}</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            autoComplete="new-password"
                            {...field}
                            data-testid="auth.reset-password.form.password"
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
                  data-testid="auth.reset-password.form.submit">
                  {form.formState.isSubmitting ? t("resetPassword.form.submitting") : t("resetPassword.form.submit")}
                </Button>
                {error && <div className="mt-2 text-sm text-red-500">{error}</div>}
                <div className="mt-4 text-center text-sm">
                  <Link
                    href="/auth/login"
                    className="underline underline-offset-4"
                    data-testid="auth.reset-password.form.login">
                    {t("resetPassword.links.login")}
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
