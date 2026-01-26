"use server";

import { eq } from "drizzle-orm";
import { defaultClient as db } from "@repo/database/clients";
import {
  type CreateUserData as CreateData,
  type UpdateUserData as UpdateData,
  user as entity,
  invitation,
} from "@repo/database/schema";
import { env } from "@/env";
import { auth } from "@/lib/auth";
import { ServerActionNotAuthorizedException } from "@/lib/exception";
import { withAdminAuth } from "@/lib/server-action-utils";

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
  await db.insert(entity).values(data).returning();
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
  await db.update(entity).set(data).where(eq(entity.id, id)).returning();
});

export const remove = withAdminAuth(async (id: string) => {
  await db.delete(entity).where(eq(entity.id, id));
});
