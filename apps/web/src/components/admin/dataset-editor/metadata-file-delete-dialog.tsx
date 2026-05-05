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

type MetadataFileDeleteDialogProps = {
  fileId: string;
  fileName: string;
  onDelete: (fileId: string) => Promise<void>;
};

export function MetadataFileDeleteDialog({ fileId, fileName, onDelete }: MetadataFileDeleteDialogProps) {
  const t = useTranslations("adminDatasetEditor.metadata.deleteDialog");
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(fileId);
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(t("error"));
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
          type="button"
          data-testid={`admin.dataset.metadata-file.delete.${fileId}`}
          title={t("confirm")}
          className="cursor-pointer">
          <Trash className="h-4 w-4" />
          <span className="sr-only">{t("confirm")}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title")}</AlertDialogTitle>
          <AlertDialogDescription>{t("description", { name: fileName })}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel disabled={isDeleting} className="w-full cursor-pointer sm:w-auto">
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid={`admin.dataset.metadata-file.delete-confirm.${fileId}`}
              variant="destructive"
              disabled={isDeleting}
              className="w-full cursor-pointer sm:w-auto"
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}>
              {isDeleting ? t("deleting") : t("confirm")}
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
