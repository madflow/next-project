"use client";

import { AlertTriangle, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useIsImpersonating } from "@/hooks/use-is-impersonating";
import { useStopImpersonating } from "@/hooks/use-stop-impersonating";

export function ImpersonationBanner() {
  const t = useTranslations("user.impersonation");
  const { isImpersonating, currentUser } = useIsImpersonating();
  const { stopImpersonating, isLoading } = useStopImpersonating();

  if (!isImpersonating || !currentUser) {
    return null;
  }

  const handleStopImpersonating = async () => {
    await stopImpersonating();
  };

  return (
    <Alert className="rounded-none border-l-0 border-r-0 border-t-0 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
      <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
      <AlertDescription className="flex items-center justify-between w-full">
        <span className="text-yellow-800 dark:text-yellow-200 font-medium">
          {t("banner.message", { userName: currentUser.name || currentUser.email })}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleStopImpersonating}
          disabled={isLoading}
          className="ml-4 cursor-pointer border-yellow-300 text-yellow-800 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-200 dark:hover:bg-yellow-900/50"
        >
          <X className="h-3 w-3 mr-1" />
          {isLoading ? t("button.stopping") : t("banner.stopButton")}
        </Button>
      </AlertDescription>
    </Alert>
  );
}