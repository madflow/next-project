"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Locale } from "@/i18n/config";
import { signIn } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { type LoginSchema, loginSchema } from "./schema";

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
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
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="align-center flex justify-between space-y-1">
          <CardTitle className="text-2xl">{t("login.title")}</CardTitle>
          <LocaleSwitcher defaultValue={locale} />
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} data-testid="auth.login.form">
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("login.form.email")}</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} data-testid="auth.login.form.email" />
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
                        <FormLabel>{t("login.form.password")}</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} data-testid="auth.login.form.password" />
                        </FormControl>
                        <FormDescription>
                          {t("login.links.forgotPassword.question")}{" "}
                          <Link
                            className="underline"
                            href="/auth/forgot-password"
                            data-testid="auth.login.form.forgot-password">
                            {t("login.links.forgotPassword.text")}
                          </Link>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full cursor-pointer" data-testid="auth.login.form.submit">
                  {t("login.form.submit")}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                {t("login.links.signUp.question")}{" "}
                <Link
                  href="/auth/sign-up"
                  className="underline underline-offset-4"
                  data-testid="auth.login.form.sign-up">
                  {t("login.links.signUp.text")}
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
