import { useSession } from "@/lib/auth-client";

type SessionWithImpersonation = {
  impersonatedBy?: string;
};

export function useIsImpersonating() {
  const session = useSession();
  
  // Check if we have session data and if there's an impersonatedBy field
  // Better-auth adds impersonation metadata to the session
  const sessionData = session.data?.session as SessionWithImpersonation | undefined;
  const isImpersonating = Boolean(
    sessionData && 
    'impersonatedBy' in sessionData &&
    sessionData.impersonatedBy
  );

  const originalUserId = isImpersonating 
    ? sessionData?.impersonatedBy 
    : null;

  return {
    isImpersonating,
    originalUserId,
    currentUser: session.data?.user,
  };
}