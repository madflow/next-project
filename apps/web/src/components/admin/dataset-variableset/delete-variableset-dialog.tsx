"use client";

import { Trash } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { deleteVariableset } from "@/actions/dataset-variableset";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteVariablesetDialogProps {
  variablesetId: string;
  variablesetName: string;
  onSuccess?: () => void;
}

export function DeleteVariablesetDialog({
  variablesetId,
  variablesetName,
  onSuccess,
}: DeleteVariablesetDialogProps) {
  const t = useTranslations("adminDatasetVariableset");
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteVariableset(variablesetId);
      setOpen(false);
      toast.success(t("deleteDialog.success"));
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error(t("deleteDialog.error"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        size="icon"
        title={t("deleteSet")}
        onClick={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
        className="cursor-pointer"
        type="button"
        data-testid="admin.dataset.variableset.delete.trigger">
        <Trash className="h-4 w-4" />
        <span className="sr-only">{t("deleteSet")}</span>
      </Button>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("deleteDialog.title")}</DialogTitle>
          <DialogDescription>{t("deleteDialog.description", { name: variablesetName })}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isDeleting}
              className="w-full cursor-pointer sm:w-auto"
              data-testid="admin.dataset.variableset.delete.cancel">
              {t("deleteDialog.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full cursor-pointer sm:w-auto"
              data-testid="admin.dataset.variableset.delete.confirm">
              {isDeleting ? t("deleteDialog.deleting") : t("deleteDialog.confirm")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
