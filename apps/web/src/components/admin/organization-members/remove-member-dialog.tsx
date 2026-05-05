"use client";

import { Trash } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

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
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          title={t("organizationMembers.removeDialog.deleteButton.title")}
          className="cursor-pointer"
          type="button">
          <Trash className="h-4 w-4" />
          <span className="sr-only">{t("organizationMembers.removeDialog.deleteButton.srText")}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("organizationMembers.removeDialog.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("organizationMembers.removeDialog.description", { name: username })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel
              onClick={() => setOpen(false)}
              disabled={isRemoving}
              className="w-full cursor-pointer sm:w-auto">
              {t("organizationMembers.removeDialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(event) => {
                event.preventDefault();
                void handleRemove();
              }}
              disabled={isRemoving}
              className="w-full cursor-pointer sm:w-auto">
              {isRemoving
                ? t("organizationMembers.removeDialog.deleting")
                : t("organizationMembers.removeDialog.confirm")}
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
