"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { defaultClient as db } from "@repo/database/clients";
import { invitation, member } from "@repo/database/schema";
import { create as createMember } from "@/dal/member";
import { auth } from "@/lib/auth";

export async function acceptInvitationAfterSignup(invitationId: string) {
  try {
    // Get the current user
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      throw new Error("User not authenticated");
    }

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
      // User is already a member, nothing to do
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

    revalidatePath("/");
    return { success: true, message: "Invitation accepted successfully" };
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return { success: false, message: "Failed to accept invitation" };
  }
}
