"use server";

import { eq } from "drizzle-orm";
import { defaultClient as db } from "@repo/database/clients";
import {
  type CreateUserData as CreateData,
  type UpdateUserData as UpdateData,
  user as entity,
  invitation,
} from "@repo/database/schema";
import { auth } from "@/lib/auth";
import { assertUserIsAdmin } from "@/lib/dal";
import { ServerActionNotAuthorizedException } from "@/lib/exception";

export async function create(data: CreateData) {
  assertUserIsAdmin();
  await db.insert(entity).values(data).returning();
}

export async function createWithInvitation(invitationId: string, data: CreateData & { password: string }) {
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

export async function update(id: string, data: UpdateData) {
  assertUserIsAdmin();
  await db.update(entity).set(data).where(eq(entity.id, id)).returning();
}

export async function remove(id: string) {
  assertUserIsAdmin();
  await db.delete(entity).where(eq(entity.id, id));
}
