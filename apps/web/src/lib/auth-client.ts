import { adminClient } from "better-auth/client/plugins";
import { organizationClient } from "better-auth/client/plugins";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { env } from "@/env";
import type { auth } from "./auth";

export const {
  admin,
  useActiveOrganization,
  useListOrganizations,
  changePassword,
  forgetPassword,
  getSession,
  resetPassword,
  sendVerificationEmail,
  signIn,
  signOut,
  signUp,
  useSession,
  organization,
  updateUser,
  deleteUser,
  changeEmail,
} = createAuthClient({
  baseURL: env.NEXT_PUBLIC_BASE_URL!,
  plugins: [adminClient(), organizationClient(), inferAdditionalFields<typeof auth>()],
});
