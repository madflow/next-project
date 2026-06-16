import { getImpersonatedBy } from "@repo/auth/shared";
import { useSession } from "@/lib/auth/client";

export function useIsImpersonating() {
  const { data } = useSession();
  const originalUserId = getImpersonatedBy(data?.session);

  return {
    isImpersonating: originalUserId !== null,
    originalUserId,
    currentUser: data?.user,
  };
}
