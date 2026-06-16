"use server";

import { eq } from "drizzle-orm";
import { defaultClient as db } from "@repo/database/clients";
import {
  type CreateUserData as CreateData,
  type UpdateUserData as UpdateData,
  invitation,
} from "@repo/database/schema";
import { env } from "@/env";
import { auth } from "@/lib/auth/server";
import { ServerActionNotAuthorizedException } from "@/lib/exception";
import { withAdminAuth } from "@/lib/server-action-utils";
import { getServerAPIClient } from "@/lib/server-api-client";

function validateCallbackURL(callbackURL: string | undefined): void {
  if (!callbackURL) return;

  if (!env.BASE_URL) {
    throw new ServerActionNotAuthorizedException("Invalid redirect URL");
  }

  const baseUrl = new URL(env.BASE_URL);
  const redirectUrl = new URL(callbackURL, env.BASE_URL);

  if (redirectUrl.origin !== baseUrl.origin) {
    throw new ServerActionNotAuthorizedException("Invalid redirect URL");
  }
}

export const create = withAdminAuth(async (data: CreateData) => {
  const api = await getServerAPIClient();

  await api.user.create(data);
});

export async function createWithInvitation(
  invitationId: string,
  data: { name: string; email: string; password: string; callbackURL?: string; locale?: string }
) {
  validateCallbackURL(data.callbackURL);

  const [existingInvitation] = await db.select().from(invitation).where(eq(invitation.id, invitationId)).limit(1);
  if (!existingInvitation) {
    throw new ServerActionNotAuthorizedException("Invitation not found");
  }

  if (existingInvitation.email !== data.email) {
    throw new ServerActionNotAuthorizedException("Invitation email does not match user email");
  }
  const signUpResponse = await auth.api.signUpEmail({
    body: {
      name: data.name,
      email: data.email,
      password: data.password,
      callbackURL: data.callbackURL,
      locale: data.locale,
    },
    params: {
      invitationId: invitationId,
    },
  });

  await auth.api.addMember({
    body: {
      userId: signUpResponse.user.id,
      role: existingInvitation.role as "admin" | "owner" | "member",
      organizationId: existingInvitation.organizationId,
    },
  });
}

export const update = withAdminAuth(async (id: string, data: UpdateData) => {
  const api = await getServerAPIClient();
  const body = Object.fromEntries(Object.entries(data).filter(([key]) => key !== "id"));

  await api.user.update({
    body,
    params: { id },
  });
});

export const remove = withAdminAuth(async (id: string) => {
  const api = await getServerAPIClient();

  await api.user.delete({ id });
});
