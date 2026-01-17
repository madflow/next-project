"use client";

import { AlertCircle, CheckCircle, Info } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Locale } from "@/i18n/config";

type VerificationState = "success" | "already-verified" | "error";

export function VerifyEmailCard() {
  const locale = useLocale() as Locale;
  const t = useTranslations();
  const searchParams = useSearchParams();

  const { state, errorMessage } = useMemo(() => {
    const error = searchParams.get("error");
    const token = searchParams.get("token");

    // Determine the verification state based on query params
    let resultState: VerificationState;
    let resultErrorMessage: string | null = null;

    if (error) {
      // Check for specific BetterAuth error codes
      if (error === "already_verified") {
        resultState = "already-verified";
      } else if (error === "invalid_token") {
        resultState = "error";
        resultErrorMessage = "Invalid or expired verification token";
      } else {
        resultState = "error";
        resultErrorMessage = error;
      }
    } else if (token) {
      // If token is present without error, verification was successful
      resultState = "success";
    } else {
      // If neither error nor token, still verifying
      resultState = "success";
    }

    return { state: resultState, errorMessage: resultErrorMessage };
  }, [searchParams]);

  const renderContent = () => {
    switch (state) {
      case "success":
        return (
          <div className="space-y-4">
            <Alert variant="default" className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-600 dark:text-green-400">
                {t("verifyEmail.messages.success.title")}
              </AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                {t("verifyEmail.messages.success.description")}
              </AlertDescription>
            </Alert>
            <Button asChild className="w-full" data-testid="verify-email.login">
              <Link href="/auth/login">{t("verifyEmail.actions.signIn")}</Link>
            </Button>
          </div>
        );

      case "already-verified":
        return (
          <div className="space-y-4">
            <Alert variant="default">
              <Info className="h-4 w-4" />
              <AlertTitle>{t("verifyEmail.messages.alreadyVerified.title")}</AlertTitle>
              <AlertDescription>{t("verifyEmail.messages.alreadyVerified.description")}</AlertDescription>
            </Alert>
            <Button asChild className="w-full" data-testid="verify-email.login">
              <Link href="/auth/login">{t("verifyEmail.actions.signIn")}</Link>
            </Button>
          </div>
        );

      case "error":
        return (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t("verifyEmail.messages.error.title")}</AlertTitle>
              <AlertDescription>{errorMessage || t("verifyEmail.messages.error.description")}</AlertDescription>
            </Alert>
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full" variant="default" data-testid="verify-email.signup">
                <Link href="/auth/sign-up">{t("verifyEmail.actions.signUpAgain")}</Link>
              </Button>
              <Button asChild className="w-full" variant="outline" data-testid="verify-email.login">
                <Link href="/auth/login">{t("verifyEmail.actions.backToLogin")}</Link>
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Card className="shadow-xs">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">{t("verifyEmail.title")}</CardTitle>
          <LocaleSwitcher defaultValue={locale} />
        </div>
        <CardDescription>{t("verifyEmail.description")}</CardDescription>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
}
