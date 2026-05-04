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

type Props = {
  userId: string;
  userName: string;
  onDelete: (id: string) => Promise<void>;
};

export function DeleteUserDialog({ userId, userName, onDelete }: Props) {
  const t = useTranslations("user");
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(userId);
      window.location.reload();
      toast.success(t("deleteDialog.success"));
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error(t("deleteDialog.error"));
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          data-testid={`admin.users.list.delete-${userName?.toLowerCase().replace(/\s+/g, "-")}`}
          title={t("deleteDialog.deleteButton.title")}
          className="cursor-pointer"
          type="button">
          <Trash className="h-4 w-4" />
          <span className="sr-only">{t("deleteDialog.deleteButton.srText")}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.rich("deleteDialog.description", {
              name: userName,
              strong: (chunks: React.ReactNode) => <span className="font-semibold">{chunks}</span>,
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel
              onClick={() => setIsOpen(false)}
              disabled={isDeleting}
              className="w-full cursor-pointer sm:w-auto">
              {t("deleteDialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
              disabled={isDeleting}
              className="w-full cursor-pointer sm:w-auto">
              {isDeleting ? t("deleteDialog.deleting") : t("deleteDialog.confirm")}
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
