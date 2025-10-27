import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { admin } from "@/lib/auth-client";

export function useStopImpersonating() {
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("user.impersonation.messages");

  const stopImpersonating = async () => {
    try {
      setIsLoading(true);
      await admin.stopImpersonating();

      toast.success(t("stopSuccess"));
      // Force a real page reload to ensure all state is properly cleared
      window.location.href = "/";
      return true;
    } catch (error) {
      toast.error(t("stopError"));
      console.error("Stop impersonation error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    stopImpersonating,
    isLoading,
  };
}
