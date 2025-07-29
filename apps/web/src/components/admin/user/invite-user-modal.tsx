"use client";

import { Button } from "@/components/ui/button";
import { organization } from "@/lib/auth-client";

export function InviteUserModal() {
  return (
    <Button
      onClick={() =>
        organization.inviteMember({
          email: "example@gmail.com", // required
          role: "member", // required
          organizationId: "7a86131f-b7b7-4480-a466-94ee6515dbde",
          resend: true,
        })
      }>
      Invite
    </Button>
  );
}
