"use client";

import { type AuthClient, createAuthClient } from "../client/index.js";

const authClient: AuthClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL ?? "",
});

export const admin: AuthClient["admin"] = authClient.admin;
export const useActiveOrganization: AuthClient["useActiveOrganization"] = authClient.useActiveOrganization;
export const changePassword: AuthClient["changePassword"] = authClient.changePassword;
export const requestPasswordReset: AuthClient["requestPasswordReset"] = authClient.requestPasswordReset;
export const resetPassword: AuthClient["resetPassword"] = authClient.resetPassword;
export const signIn: AuthClient["signIn"] = authClient.signIn;
export const signOut: AuthClient["signOut"] = authClient.signOut;
export const signUp: AuthClient["signUp"] = authClient.signUp;
export const useSession: AuthClient["useSession"] = authClient.useSession;
export const organization: AuthClient["organization"] = authClient.organization;
export const updateUser: AuthClient["updateUser"] = authClient.updateUser;
export const deleteUser: AuthClient["deleteUser"] = authClient.deleteUser;
export const changeEmail: AuthClient["changeEmail"] = authClient.changeEmail;

export { authClient };
