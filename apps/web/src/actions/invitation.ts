"use server";

import { and, eq, gt } from "drizzle-orm";
import { headers } from "next/headers";
import { defaultClient as db } from "@repo/database/clients";
import {
  invitation as invitationTable,
  member as memberTable,
  organization as organizationTable,
  user as userTable,
} from "@repo/database/schema";
import { OrganizationInvite, getEmailTranslations } from "@repo/email";
import { env } from "@/env";
import { sendAuthEmail } from "@/lib/auth-email";
import {
  ServerActionFailureException,
  ServerActionNotAuthorizedException,
  ServerActionValidationException,
} from "@/lib/exception";
import { getSessionOrThrow } from "@/lib/server-action-utils";
import { defaultLocale, extractAppLocale } from "../i18n/config";

type InviteMemberInput = {
  email: string;
  role: "admin" | "member" | "owner";
  organizationId: string;
  resend?: boolean;
};

const INVITATION_TTL_MS = 48 * 60 * 60 * 1000;

export async function inviteMember(input: InviteMemberInput) {
  const session = await getSessionOrThrow();
  const organizationId = input.organizationId || session.session.activeOrganizationId;

  if (!organizationId) {
    throw new ServerActionValidationException("Organization is required");
  }

  const email = input.email.toLowerCase();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + INVITATION_TTL_MS);

  const [inviter] = await db.select().from(userTable).where(eq(userTable.id, session.user.id)).limit(1);
  if (!inviter) {
    throw new ServerActionNotAuthorizedException("Authentication required");
  }

  const [organization] = await db
    .select()
    .from(organizationTable)
    .where(eq(organizationTable.id, organizationId))
    .limit(1);
  if (!organization) {
    throw new ServerActionValidationException("Organization not found");
  }

  const [inviterMember] = await db
    .select()
    .from(memberTable)
    .where(and(eq(memberTable.organizationId, organizationId), eq(memberTable.userId, session.user.id)))
    .limit(1);

  if (!inviterMember) {
    throw new ServerActionNotAuthorizedException("You are not allowed to invite users to this organization");
  }

  const inviterRoles = inviterMember.role
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean);

  if (!inviterRoles.includes("owner") && !inviterRoles.includes("admin")) {
    throw new ServerActionNotAuthorizedException("You are not allowed to invite users to this organization");
  }

  if (!inviterRoles.includes("owner") && input.role === "owner") {
    throw new ServerActionNotAuthorizedException("You are not allowed to invite a user with this role");
  }

  const [existingUser] = await db.select().from(userTable).where(eq(userTable.email, email)).limit(1);
  if (existingUser) {
    const [existingMember] = await db
      .select()
      .from(memberTable)
      .where(and(eq(memberTable.organizationId, organizationId), eq(memberTable.userId, existingUser.id)))
      .limit(1);

    if (existingMember) {
      throw new ServerActionValidationException("User is already a member of this organization");
    }
  }

  const [existingInvitation] = await db
    .select()
    .from(invitationTable)
    .where(
      and(
        eq(invitationTable.organizationId, organizationId),
        eq(invitationTable.email, email),
        eq(invitationTable.status, "pending"),
        gt(invitationTable.expiresAt, now)
      )
    )
    .limit(1);

  let invitation = existingInvitation;

  if (existingInvitation) {
    if (!input.resend) {
      throw new ServerActionValidationException("User is already invited to this organization");
    }

    const [updatedInvitation] = await db
      .update(invitationTable)
      .set({ expiresAt })
      .where(eq(invitationTable.id, existingInvitation.id))
      .returning();

    invitation = updatedInvitation;
  } else {
    const [createdInvitation] = await db
      .insert(invitationTable)
      .values({
        organizationId,
        email,
        role: input.role,
        status: "pending",
        createdAt: now,
        expiresAt,
        inviterId: inviter.id,
      })
      .returning();

    invitation = createdInvitation;
  }

  if (!invitation) {
    throw new ServerActionFailureException("Failed to create invitation");
  }

  const cookieHeader = (await headers()).get("cookie");
  const requestedLocale = cookieHeader ? extractAppLocale(cookieHeader) : undefined;
  const locale = inviter.locale || requestedLocale || defaultLocale;

  const inviteLink = `${env.BASE_URL}/auth/accept-invitation/${invitation.id}`;
  const { subject, heading, content, action } = getEmailTranslations("organizationInvite", locale, {
    organizationName: organization.name,
    inviterName: inviter.name ?? undefined,
  });

  try {
    await sendAuthEmail(
      {
        to: invitation.email,
        from: env.MAIL_DEFAULT_SENDER,
        subject,
        text: `${content}\n\n${action}: ${inviteLink}`,
        react: OrganizationInvite({
          email: invitation.email,
          url: inviteLink,
          heading,
          content,
          action,
          organizationName: organization.name,
          inviterName: inviter.name,
          inviterEmail: inviter.email,
          baseUrl: env.BASE_URL,
          siteName: env.SITE_NAME,
          locale,
        }),
      },
      {
        emailType: "organizationInvite",
        organizationId: organization.id,
        invitationId: invitation.id,
        inviterId: inviter.id,
      }
    );
  } catch (error) {
    throw new ServerActionFailureException(error instanceof Error ? error.message : "Failed to send invitation");
  }

  return {
    invitationId: invitation.id,
    success: true,
  };
}
