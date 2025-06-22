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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(true)}
        data-testid={`admin.projects.list.delete-${projectName?.toLowerCase().replace(/\s+/g, "-")}`}
        title={t("deleteDialog.deleteButton.title")}
        className="cursor-pointer">
        <Trash className="h-4 w-4" />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("deleteDialog.title")}</DialogTitle>
          <DialogDescription>
            {t.rich("deleteDialog.description", {
              name: projectName,
              strong: (chunks) => <span className="font-semibold">{chunks}</span>,
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isDeleting}>
            {t("deleteDialog.cancel")}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="cursor-pointer">
            {isDeleting ? t("deleteDialog.deleting") : t("deleteDialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
