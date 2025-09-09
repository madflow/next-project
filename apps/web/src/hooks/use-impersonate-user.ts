import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { admin } from "@/lib/auth-client";

export function useImpersonateUser() {
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("user.impersonation.messages");

  const impersonateUser = async (userId: string) => {
    try {
      setIsLoading(true);
      const { error } = await admin.impersonateUser({
        userId,
      });

      if (error) {
        toast.error(t("impersonateError"));
        console.error("Impersonation error:", error);
        return false;
      }

      toast.success(t("impersonateSuccess"));
      // Force a real page reload to ensure all state is properly cleared
      window.location.href = "/";
      return true;
    } catch (error) {
      toast.error(t("impersonateError"));
      console.error("Impersonation error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    impersonateUser,
    isLoading,
  };
}