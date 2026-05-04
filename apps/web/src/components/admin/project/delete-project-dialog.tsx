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
  projectId: string;
  projectName: string;
  onDelete: (id: string) => Promise<void>;
};

export function DeleteProjectDialog({ projectId, projectName, onDelete }: Props) {
  const t = useTranslations("project");
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(projectId);
      toast.success(t("messages.deleteSuccess"));
      window.location.reload();
    } catch (error) {
      console.error("Error deleting project:", error);
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
          data-testid={`admin.projects.list.delete-${projectName?.toLowerCase().replace(/\s+/g, "-")}`}
          title={t("deleteDialog.deleteButton.title")}
          className="cursor-pointer"
          type="button">
          <Trash className="h-4 w-4" />
          <span className="sr-only">{t("deleteDialog.deleteButton.title")}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.rich("deleteDialog.description", {
              name: projectName,
              strong: (chunks: React.ReactNode) => <span className="font-semibold">{chunks}</span>,
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsOpen(false)} disabled={isDeleting}>
            {t("deleteDialog.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(event) => {
              event.preventDefault();
              void handleDelete();
            }}
            disabled={isDeleting}
            className="cursor-pointer">
            {isDeleting ? t("deleteDialog.deleting") : t("deleteDialog.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
