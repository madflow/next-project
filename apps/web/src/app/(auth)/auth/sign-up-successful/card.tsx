"use client";

import { CheckCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Locale } from "@/i18n/config";

export function SignUpSuccessfulCard() {
  const locale = useLocale() as Locale;
  const t = useTranslations();

  return (
    <Card className="shadow-xs">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl" data-testid="auth.sign-up-successful.title">
            {t("signUpSuccessful.title")}
          </CardTitle>
          <LocaleSwitcher defaultValue={locale} />
        </div>
        <CardDescription>{t("signUpSuccessful.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert variant="default" className="border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-600 dark:text-green-400">
              {t("signUpSuccessful.messages.success.title")}
            </AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-300">
              {t("signUpSuccessful.messages.success.description")}
            </AlertDescription>
          </Alert>
          <Button asChild className="w-full" data-testid="auth.sign-up-successful.login">
            <Link href="/auth/login">{t("signUpSuccessful.actions.signIn")}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
