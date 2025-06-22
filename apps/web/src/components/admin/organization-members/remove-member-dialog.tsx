"use client";

import { Trash } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RemoveMemberDialogProps {
  memberId: string;
  username: string;
  onRemove: (memberId: string) => Promise<void>;
}

export function RemoveMemberDialog({ memberId, username, onRemove }: RemoveMemberDialogProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    try {
      setIsRemoving(true);
      await onRemove(memberId);
      setOpen(false);
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error(t("organizationMembers.removeDialog.error"));
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        size="icon"
        title={t("organizationMembers.removeDialog.deleteButton.title")}
        onClick={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
        className="cursor-pointer"
        type="button">
        <Trash className="h-4 w-4" />
        <span className="sr-only">{t("organizationMembers.removeDialog.deleteButton.srText")}</span>
      </Button>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("organizationMembers.removeDialog.title")}</DialogTitle>
          <DialogDescription>{t("organizationMembers.removeDialog.description", { name: username })}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isRemoving}
              className="w-full cursor-pointer sm:w-auto">
              {t("organizationMembers.removeDialog.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={isRemoving}
              className="w-full cursor-pointer sm:w-auto">
              {isRemoving
                ? t("organizationMembers.removeDialog.deleting")
                : t("organizationMembers.removeDialog.confirm")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
