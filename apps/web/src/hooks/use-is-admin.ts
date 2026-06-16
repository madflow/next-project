import { isAdminUser } from "@repo/auth/shared";
import { useSession } from "@/lib/auth/client";

export function useIsAdmin() {
  const { data } = useSession();
  return isAdminUser(data?.user);
}
