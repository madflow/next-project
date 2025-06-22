import { useSession } from "@/lib/auth-client";

export function useIsAdmin() {
  const session = useSession();
  if (!session) {
    return false;
  } else {
    return session.data?.user.role === "admin";
  }
}
