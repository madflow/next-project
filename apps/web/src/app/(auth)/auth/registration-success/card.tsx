"use client";

import { CheckCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Locale } from "@/i18n/config";

export function RegistrationSuccessCard() {
  const locale = useLocale() as Locale;
  const t = useTranslations("registrationSuccess");

  return (
    <Card className="shadow-xs">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
          <LocaleSwitcher defaultValue={locale} />
        </div>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert variant="default" className="border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-600 dark:text-green-400">{t("alert.title")}</AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-300">{t("alert.description")}</AlertDescription>
          </Alert>
          <Button asChild className="w-full" data-testid="auth.registration-success.login">
            <Link href="/auth/login">{t("actions.signIn")}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
