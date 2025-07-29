"use client";

import { Organization } from "better-auth/plugins";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { User } from "@/types/user";
import { InviteUserForm } from "./invite-user-form";

type InfoUserModalProps = {
  user?: User;
  organization?: Organization;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
} & Partial<React.ComponentProps<typeof DialogTrigger>>;

export const InviteUserModal = ({ children, user, onOpenChange, open, organization }: InfoUserModalProps) => {
  const t = useTranslations("inviteUserModal");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[768px]">
        <DialogHeader>
          <DialogTitle>{user ? t("titleUser", { name: user.name }) : t("title")}</DialogTitle>
          <DialogDescription>
            {organization
              ? t.rich("descriptionOrg", { name: organization.name, highlight: (chunks) => <b>{chunks}</b> })
              : t("description")}
          </DialogDescription>
        </DialogHeader>
        <InviteUserForm user={user} organizationId={organization?.id} />
        <DialogFooter>
          <DialogClose asChild>
            <Button data-testid="invite-user-modal.close" variant="outline">
              {t("close")}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
