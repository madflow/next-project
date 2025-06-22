"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
      callbackURL: env.NEXT_PUBLIC_BASE_URL!,
    });

    if (error && error.message) {
      form.setError("email", { message: error.message });
    }

    if (data) {
      form.reset();
      redirect("/auth/login");
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="space-y-1">
          <div className="align-center flex justify-between">
            <CardTitle className="text-2xl">{t("signUp.title")}</CardTitle>
            <LocaleSwitcher defaultValue={locale} />
          </div>
          <CardDescription>{t("signUp.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form data-testid="auth.sign-up.form" onSubmit={form.handleSubmit(handleSubmit)}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("signUp.form.email")}</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} data-testid="auth.sign-up.form.email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("signUp.form.name")}</FormLabel>
                        <FormControl>
                          <Input type="text" {...field} data-testid="auth.sign-up.form.name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("signUp.form.password")}</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} data-testid="auth.sign-up.form.password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("signUp.form.confirmPassword")}</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} data-testid="auth.sign-up.form.confirm-password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
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
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
