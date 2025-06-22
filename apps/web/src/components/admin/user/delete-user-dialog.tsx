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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(true)}
        data-testid={`admin.users.list.delete-${userName?.toLowerCase().replace(/\s+/g, "-")}`}
        title={t("deleteDialog.deleteButton.title")}
        className="cursor-pointer"
        type="button">
        <Trash className="h-4 w-4" />
        <span className="sr-only">{t("deleteDialog.deleteButton.srText")}</span>
      </Button>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("deleteDialog.title")}</DialogTitle>
          <DialogDescription>
            {t.rich("deleteDialog.description", {
              name: userName,
              strong: (chunks) => <span className="font-semibold">{chunks}</span>,
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isDeleting}
              className="w-full cursor-pointer sm:w-auto">
              {t("deleteDialog.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full cursor-pointer sm:w-auto">
              {isDeleting ? t("deleteDialog.deleting") : t("deleteDialog.confirm")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
