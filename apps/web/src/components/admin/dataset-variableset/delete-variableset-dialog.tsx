"use client";

import { Trash } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { deleteVariableset } from "@/actions/dataset-variableset";
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

interface DeleteVariablesetDialogProps {
  variablesetId: string;
  variablesetName: string;
  onSuccess?: () => void;
}

export function DeleteVariablesetDialog({ variablesetId, variablesetName, onSuccess }: DeleteVariablesetDialogProps) {
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
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          title={t("deleteSet")}
          className="cursor-pointer"
          type="button"
          data-testid="admin.dataset.variableset.delete.trigger">
          <Trash className="h-4 w-4" />
          <span className="sr-only">{t("deleteSet")}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
          <AlertDialogDescription>{t("deleteDialog.description", { name: variablesetName })}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel
              onClick={() => setOpen(false)}
              disabled={isDeleting}
              className="w-full cursor-pointer sm:w-auto"
              data-testid="admin.dataset.variableset.delete.cancel">
              {t("deleteDialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
              disabled={isDeleting}
              className="w-full cursor-pointer sm:w-auto"
              data-testid="admin.dataset.variableset.delete.confirm">
              {isDeleting ? t("deleteDialog.deleting") : t("deleteDialog.confirm")}
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
