"use client";

import { Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import type { DatasetVariablesetItemAttributes } from "@repo/database/schema";
import { updateVariablesetItemAttributes } from "@/actions/dataset-variableset";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface AllowedStatisticsSelectorProps {
  variablesetId: string;
  variableId: string;
  currentAttributes: DatasetVariablesetItemAttributes;
  onUpdate: () => void;
}

export function AllowedStatisticsSelector({
  variablesetId,
  variableId,
  currentAttributes,
  onUpdate,
}: AllowedStatisticsSelectorProps) {
  const t = useTranslations("adminDatasetVariableset.allowedStatistics");
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [distribution, setDistribution] = useState(currentAttributes.allowedStatistics.distribution);
  const [mean, setMean] = useState(currentAttributes.allowedStatistics.mean);

  const handleSave = async () => {
    // Validation: at least one must be selected
    if (!distribution && !mean) {
      toast.error(t("validation.atLeastOne"));
      return;
    }

    setIsSaving(true);
    try {
      await updateVariablesetItemAttributes(variablesetId, variableId, {
        allowedStatistics: {
          distribution,
          mean,
        },
      });
      toast.success(t("success"));
      onUpdate();
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(t("error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset to current values when closing
      setDistribution(currentAttributes.allowedStatistics.distribution);
      setMean(currentAttributes.allowedStatistics.mean);
    }
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-xs"
          data-testid="admin.dataset.variableset.allowed-statistics.open">
          <Settings className="mr-1 h-3 w-3" />
          {t("configure")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="distribution"
              checked={distribution}
              onCheckedChange={(checked) => setDistribution(checked === true)}
              data-testid="admin.dataset.variableset.allowed-statistics.distribution"
            />
            <Label htmlFor="distribution" className="cursor-pointer text-sm font-normal">
              {t("distribution")}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="mean"
              checked={mean}
              onCheckedChange={(checked) => setMean(checked === true)}
              data-testid="admin.dataset.variableset.allowed-statistics.mean"
            />
            <Label htmlFor="mean" className="cursor-pointer text-sm font-normal">
              {t("mean")}
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSaving}
            data-testid="admin.dataset.variableset.allowed-statistics.cancel">
            {t("cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || (!distribution && !mean)}
            data-testid="admin.dataset.variableset.allowed-statistics.save">
            {isSaving ? t("saving") : t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
