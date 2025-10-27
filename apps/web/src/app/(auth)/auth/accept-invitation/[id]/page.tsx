import { and, eq, ilike } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { defaultClient as db } from "@repo/database/clients";
import { invitation, member, user } from "@repo/database/schema";
import { AuthAcceptInvitationCard } from "@/components/auth-accept-invitation-card";
import { SignUpFormWithInvitation } from "@/components/sign-up-form-with-invitation";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  // Await params before accessing properties
  const { id } = await params;
  const t = await getTranslations("authAcceptInvitation");

  // Check if the invitation exists in the database
  const [existingInvitation] = await db.select().from(invitation).where(eq(invitation.id, id)).limit(1);

  // If the invitation doesn't exist, return 404
  if (!existingInvitation) {
    notFound();
  }

  // Check if the invitation email corresponds to an existing user
  const [existingUser] = await db.select().from(user).where(ilike(user.email, existingInvitation.email)).limit(1);

  // Check if the user is already a member of the organization from the invitation
  let isAlreadyMember = false;
  if (existingUser) {
    const [existingMember] = await db
      .select()
      .from(member)
      .where(and(eq(member.organizationId, existingInvitation.organizationId), eq(member.userId, existingUser.id)))
      .limit(1);

    isAlreadyMember = !!existingMember;
  }

  // Store this information to determine if the user needs to sign up or can directly accept the invitation
  const needsToSignUp = !existingUser;
  const canDirectlyAccept = !needsToSignUp && !isAlreadyMember;

  console.log("canDirectlyAccept", canDirectlyAccept);

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-4"
      data-testid="auth.accept-invitation.page">
      <div className="w-full max-w-md">
        {canDirectlyAccept ? (
          <AuthAcceptInvitationCard invitationId={id} userId={existingUser?.id} />
        ) : needsToSignUp ? (
          <SignUpFormWithInvitation
            invitation={{
              id: existingInvitation.id,
              email: existingInvitation.email,
              organizationId: existingInvitation.organizationId,
              role: existingInvitation.role ?? "member",
            }}
          />
        ) : (
          <div className="text-center">
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            <p className="mt-4">{t("alreadyMember")}</p>
          </div>
        )}
      </div>
    </main>
  );
}
