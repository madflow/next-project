"use client";

import { UserCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useImpersonateUser } from "@/hooks/use-impersonate-user";
import { useIsAdmin } from "@/hooks/use-is-admin";

interface ImpersonateUserButtonProps {
  userId: string;
  userRole: string;
}

export function ImpersonateUserButton({ userId, userRole }: ImpersonateUserButtonProps) {
  const t = useTranslations("user");
  const { impersonateUser, isLoading } = useImpersonateUser();
  const isAdmin = useIsAdmin();

  // Don't show impersonate button if current user is not admin or target user is admin
  if (!isAdmin || userRole === "admin") {
    return null;
  }

  const handleImpersonate = async () => {
    await impersonateUser(userId);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleImpersonate}
      disabled={isLoading}
      title={t("actions.impersonate")}
      className="cursor-pointer"
      data-testid={`admin.users.list.impersonate-${userId}`}>
      <UserCheck className="h-4 w-4" />
      <span className="sr-only">{t("actions.impersonate")}</span>
    </Button>
  );
}
