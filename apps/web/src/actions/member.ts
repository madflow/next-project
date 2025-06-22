"use server";

import { and, eq } from "drizzle-orm";
import { defaultClient as db } from "@repo/database/clients";
import { type CreateMemberData, member as memberTable, organization as organizationTable } from "@repo/database/schema";
import { assertUserIsAdmin } from "@/lib/dal";

type AddMemberData = {
  userId: string;
  role: "admin" | "owner" | "member";
};

export async function addMember(organizationId: string, data: AddMemberData) {
  assertUserIsAdmin();

  // Check if the organization exists
  const [org] = await db.select().from(organizationTable).where(eq(organizationTable.id, organizationId)).limit(1);

  if (!org) {
    throw new Error("Organization not found");
  }

  // Check if the user is already a member of the organization
  const [existingMember] = await db
    .select()
    .from(memberTable)
    .where(and(eq(memberTable.organizationId, organizationId), eq(memberTable.userId, data.userId)))
    .limit(1);

  if (existingMember) {
    throw new Error("User is already a member of this organization");
  }

  // Create the member data
  const memberData: CreateMemberData = {
    organizationId,
    userId: data.userId,
    role: data.role,
    createdAt: new Date(),
  };

  // Add the member to the organization
  await db.insert(memberTable).values(memberData);

  return { success: true };
}

export async function updateMemberRole(organizationId: string, userId: string, role: "admin" | "owner" | "member") {
  assertUserIsAdmin();

  await db
    .update(memberTable)
    .set({ role })
    .where(and(eq(memberTable.organizationId, organizationId), eq(memberTable.userId, userId)));

  return { success: true };
}

export async function removeMember(memberId: string) {
  assertUserIsAdmin();

  await db.delete(memberTable).where(eq(memberTable.id, memberId));
}
