"use server";

import { and, eq } from "drizzle-orm";
import { defaultClient as db } from "@repo/database/clients";
import { invitation, member } from "@repo/database/schema";
import { create as createMember } from "@/dal/member";
import { getSessionOrThrow, withAuth } from "@/lib/server-action-utils";

export const acceptInvitationAfterSignup = withAuth(async (invitationId: string) => {
  try {
    const session = await getSessionOrThrow();

    // Verify the invitation exists and is for this user's email
    const [existingInvitation] = await db.select().from(invitation).where(eq(invitation.id, invitationId)).limit(1);

    if (!existingInvitation) {
      throw new Error("Invitation not found");
    }

    if (existingInvitation.email.toLowerCase() !== session.user.email.toLowerCase()) {
      throw new Error("Invitation email does not match user email");
    }

    // Check if user is already a member of the organization
    const [existingMember] = await db
      .select()
      .from(member)
      .where(and(eq(member.organizationId, existingInvitation.organizationId), eq(member.userId, session.user.id)))
      .limit(1);

    if (existingMember) {
      return { success: true, message: "Already a member" };
    }

    // Create the membership
    await createMember({
      organizationId: existingInvitation.organizationId,
      userId: session.user.id,
      role: existingInvitation.role ?? "member",
    });

    // Mark invitation as accepted
    await db.update(invitation).set({ status: "accepted" }).where(eq(invitation.id, invitationId));

    return { success: true, message: "Invitation accepted successfully" };
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return { success: false, message: "Failed to accept invitation" };
  }
});
