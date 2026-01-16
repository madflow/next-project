"use client";

import { Terminal } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Locale } from "@/i18n/config";

export function CheckEmailCard() {
  const locale = useLocale() as Locale;
  const t = useTranslations();

  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="align-center flex justify-between">
          <CardTitle className="text-2xl">{t("checkEmail.title")}</CardTitle>
          <LocaleSwitcher defaultValue={locale} />
        </div>
        <CardDescription>{t("checkEmail.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="default">
          <Terminal className="h-4 w-4" />
          <AlertTitle>{t("checkEmail.alert.title")}</AlertTitle>
          <AlertDescription>
            <div className="space-y-2">
              <p>{t("checkEmail.alert.checkInbox")}</p>
              <p className="text-muted-foreground text-sm">{t("checkEmail.alert.checkSpam")}</p>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
