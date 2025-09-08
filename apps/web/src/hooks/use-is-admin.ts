import { useSession } from "@/lib/auth-client";

export function useIsAdmin() {
  const session = useSession();
  if (!session) {
    return false;
  } else {
    // Check if user is admin - this works both for normal sessions and impersonation
    // During impersonation, the session.data.user reflects the impersonated user
    // The admin privileges come from the original admin user who initiated the impersonation
    return session.data?.user.role === "admin";
  }
}
