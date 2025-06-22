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
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        size="icon"
        title={t("organization.deleteDialog.deleteButton.title")}
        onClick={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
        className="cursor-pointer"
        type="button">
        <Trash className="h-4 w-4" />
        <span className="sr-only">{t("organization.deleteDialog.deleteButton.srText")}</span>
      </Button>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("organization.deleteDialog.title")}</DialogTitle>
          <DialogDescription>
            {t("organization.deleteDialog.description", { name: organizationName })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isDeleting}
              className="w-full cursor-pointer sm:w-auto">
              {t("organization.deleteDialog.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full cursor-pointer sm:w-auto">
              {isDeleting ? t("organization.deleteDialog.deleting") : t("organization.deleteDialog.confirm")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
