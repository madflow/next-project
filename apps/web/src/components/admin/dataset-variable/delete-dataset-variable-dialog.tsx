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

interface DeleteDatasetVariableDialogProps {
  datasetVariableId: string;
  datasetVariableName: string;
  onDelete: (id: string) => Promise<void>;
}

export function DeleteDatasetVariableDialog({ datasetVariableId, datasetVariableName, onDelete }: DeleteDatasetVariableDialogProps) {
  const t = useTranslations("adminDatasetEditor");
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(datasetVariableId);
      setOpen(false);
      // Refresh the page to reflect the changes
      window.location.reload();
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
        title={t("tableActions.delete")}
        onClick={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
        className="cursor-pointer"
        type="button"
      >
        <Trash className="h-4 w-4" />
        <span className="sr-only">{t("tableActions.delete")}</span>
      </Button>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("deleteDialog.title")}</DialogTitle>
          <DialogDescription>{t("deleteDialog.description", { name: datasetVariableName })}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isDeleting}
              className="w-full cursor-pointer sm:w-auto"
            >
              {t("deleteDialog.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full cursor-pointer sm:w-auto"
            >
              {isDeleting ? t("deleteDialog.deleting") : t("deleteDialog.confirm")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
