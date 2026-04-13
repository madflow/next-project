"use server";

import { and, eq } from "drizzle-orm";
import { invitation, member } from "@repo/database/schema";
import { getAuthenticatedClient } from "@/dal/dal";
import { ServerActionFailureException, ServerActionValidationException } from "@/lib/exception";
import { getSessionOrThrow, withAuth } from "@/lib/server-action-utils";

export const acceptInvitationAfterSignup = withAuth(async (invitationId: string) => {
  const session = await getSessionOrThrow();
  const db = await getAuthenticatedClient();

  const [existingInvitation] = await db.select().from(invitation).where(eq(invitation.id, invitationId)).limit(1);

  if (!existingInvitation) {
    throw new ServerActionValidationException("Invitation not found");
  }

  if (existingInvitation.email.toLowerCase() !== session.user.email.toLowerCase()) {
    throw new ServerActionValidationException("Invitation email does not match user email");
  }

  const [existingMember] = await db
    .select()
    .from(member)
    .where(and(eq(member.organizationId, existingInvitation.organizationId), eq(member.userId, session.user.id)))
    .limit(1);

  if (existingMember) {
    return { success: true, message: "Already a member" };
  }

  const [createdMember] = await db
    .insert(member)
    .values({
      organizationId: existingInvitation.organizationId,
      userId: session.user.id,
      role: existingInvitation.role ?? "member",
      createdAt: new Date(),
    })
    .returning();

  if (!createdMember) {
    throw new ServerActionFailureException("Failed to create organization membership");
  }

  await db.update(invitation).set({ status: "accepted" }).where(eq(invitation.id, invitationId));

  return { success: true, message: "Invitation accepted successfully" };
});
