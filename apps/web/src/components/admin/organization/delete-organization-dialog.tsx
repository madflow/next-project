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

interface DeleteOrganizationDialogProps {
  organizationId: string;
  organizationName: string;
  onDelete: (id: string) => Promise<void>;
}

export function DeleteOrganizationDialog({
  organizationId,
  organizationName,
  onDelete,
}: DeleteOrganizationDialogProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(organizationId);
      setOpen(false);
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error(t("organization.deleteDialog.error"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          title={t("organization.deleteDialog.deleteButton.title")}
          className="cursor-pointer"
          type="button">
          <Trash className="h-4 w-4" />
          <span className="sr-only">{t("organization.deleteDialog.deleteButton.srText")}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("organization.deleteDialog.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("organization.deleteDialog.description", { name: organizationName })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel
              onClick={() => setOpen(false)}
              disabled={isDeleting}
              className="w-full cursor-pointer sm:w-auto">
              {t("organization.deleteDialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
              disabled={isDeleting}
              className="w-full cursor-pointer sm:w-auto">
              {isDeleting ? t("organization.deleteDialog.deleting") : t("organization.deleteDialog.confirm")}
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
