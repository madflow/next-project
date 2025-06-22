import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function GoodbyePage() {
  const t = await getTranslations();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">{t("account.delete.successTitle")}</CardTitle>
          <CardDescription>{t("account.delete.successMessage")}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild>
            <Link href="/">{t("account.delete.returnHome")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
