"use client";

import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteAccountDialog } from "./delete-account-dialog";

export function DeleteAccountSection() {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const t = useTranslations();

  return (
    <Card className="border-destructive w-full shadow-xs">
      <CardHeader>
        <CardTitle className="text-destructive text-lg sm:text-xl">{t("account.delete.title")}</CardTitle>
        <CardDescription>{t("account.delete.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("account.delete.warningTitle")}</AlertTitle>
          <AlertDescription>{t("account.delete.warningDescription")}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="cursor-pointer"
            data-testid="app.user.account.delete-account">
            {t("account.delete.button")}
          </Button>
          <DeleteAccountDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} />
        </div>
      </CardContent>
    </Card>
  );
}
