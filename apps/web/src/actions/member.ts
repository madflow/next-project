"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { defaultClient as db } from "@repo/database/clients";
import { type CreateMemberData, member as memberTable, organization as organizationTable } from "@repo/database/schema";
import { withAdminAuth } from "@/lib/server-action-utils";

type AddMemberData = {
  userId: string;
  role: "admin" | "owner" | "member";
};

export const addMember = withAdminAuth(async (organizationId: string, data: AddMemberData) => {
  const [org] = await db.select().from(organizationTable).where(eq(organizationTable.id, organizationId)).limit(1);

  if (!org) {
    throw new Error("Organization not found");
  }

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

  await db.insert(memberTable).values(memberData);

  revalidatePath(`/admin/organizations/${organizationId}/members`);

  return { success: true };
});

export const removeMember = withAdminAuth(async (memberId: string) => {
  const [member] = await db.select().from(memberTable).where(eq(memberTable.id, memberId)).limit(1);

  await db.delete(memberTable).where(eq(memberTable.id, memberId));

  if (member) {
    revalidatePath(`/admin/organizations/${member.organizationId}/members`);
  }
});
