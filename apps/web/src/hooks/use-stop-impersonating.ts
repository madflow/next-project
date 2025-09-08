import { useState } from "react";
import { toast } from "sonner";
import { admin } from "@/lib/auth-client";

export function useStopImpersonating() {
  const [isLoading, setIsLoading] = useState(false);

  const stopImpersonating = async () => {
    try {
      setIsLoading(true);
      await admin.stopImpersonating();
      
      toast.success("Stopped impersonating user");
      // Force a real page reload to ensure all state is properly cleared
      window.location.href = "/";
      return true;
    } catch (error) {
      toast.error("Failed to stop impersonating. Please try again.");
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