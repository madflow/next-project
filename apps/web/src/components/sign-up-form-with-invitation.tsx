"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createWithInvitation } from "@/actions/user";
import { type SignUpSchema, signUpSchema } from "@/app/(auth)/auth/sign-up/schema";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
    const now = new Date();
    await createWithInvitation(invitation.id, {
      email: values.email,
      name: values.name,
      emailVerified: true,
      role: "user",
      createdAt: now,
      updatedAt: now,
      password: values.password,
    });

    form.reset();
    router.push(`/auth/login`);
  };

  return (
    <div className={cn("flex flex-col gap-6")}>
      <Card>
        <CardHeader className="space-y-1">
          <div className="align-center flex justify-between">
            <CardTitle className="text-2xl">{t("authAcceptInvitation.title")}</CardTitle>
            <LocaleSwitcher defaultValue={locale} />
          </div>
          <CardDescription>{t("authAcceptInvitation.needToSignUp")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form data-testid="auth.sign-up-with-invitation.form" onSubmit={form.handleSubmit(handleSubmit)}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("signUp.form.email")}</FormLabel>
                        <FormControl>
                          <Input disabled type="email" {...field} data-testid="auth.sign-up.form.email" readOnly />
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
