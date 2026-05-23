import { createAuthClient } from "@repo/auth/client";
import { env } from "@/env";

const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_BASE_URL!,
});

export const {
  admin,
  useActiveOrganization,

  changePassword,
  requestPasswordReset,

  resetPassword,

  signIn,
  signOut,
  signUp,
  useSession,
  organization,
  updateUser,
  deleteUser,
  changeEmail,
} = authClient;
