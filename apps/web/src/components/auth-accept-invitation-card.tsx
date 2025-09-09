"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { organization, useSession } from "@/lib/auth-client";
import { Spinner } from "./ui/spinner";

export function AuthAcceptInvitationCard({ invitationId, userId }: { invitationId: string; userId?: string }) {
  const t = useTranslations("authAcceptInvitation");
  const session = useSession();
  const router = useRouter();

  const handleAcceptInvitation = async () => {
    try {
      const result = await organization.acceptInvitation({
        invitationId,
        fetchOptions: {
          onSuccess: () => {
            toast.success(t("invitationAccepted"));
            router.push("/");
            router.refresh();
          },
        },
      });

      if (result.error) {
        toast.error(result.error.message || t("failedToAccept"));
      }
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast.error(t("errorOccurred"));
    }
  };

  if (session.isPending) {
    return <Spinner />;
  }

  if (session.data === null) {
    return (
      <Card className="w-full max-w-md shadow-xs" data-testid="auth-accept-invitation-card-not-signed-in">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>{t("notSignedIn")}</CardContent>
      </Card>
    );
  }

  if (session.data?.user.id !== userId) {
    return (
      <Card className="w-full max-w-md shadow-xs" data-testid="auth-accept-invitation-card-not-authorized">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>{t("notAuthorized")}</CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-xs" data-testid="auth-accept-invitation-card">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button onClick={handleAcceptInvitation} className="w-full" data-testid="auth-accept-invitation-card.accept">
          {t("acceptButton")}
        </Button>
      </CardFooter>
    </Card>
  );
}
