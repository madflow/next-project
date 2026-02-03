"use client";

import { Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import type { DatasetVariableMeasure, DatasetVariablesetItemAttributes } from "@repo/database/schema";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AllowedStatisticsSelectorProps {
  variablesetId: string;
  variableId: string;
  variableMeasure: DatasetVariableMeasure;
  currentAttributes: DatasetVariablesetItemAttributes;
  onUpdate: () => void;
}

export function AllowedStatisticsSelector({
  variablesetId,
  variableId,
  variableMeasure,
  currentAttributes,
  onUpdate,
}: AllowedStatisticsSelectorProps) {
  const t = useTranslations("adminDatasetVariableset.allowedStatistics");
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [distribution, setDistribution] = useState(currentAttributes.allowedStatistics.distribution);
  const [mean, setMean] = useState(currentAttributes.allowedStatistics.mean);
  const [valueRange, setValueRange] = useState<{ min?: number; max?: number }>({
    min: currentAttributes.valueRange?.min,
    max: currentAttributes.valueRange?.max,
  });

  const isScaleVariable = variableMeasure === "scale";
  const showValueRange = isScaleVariable && mean;

  const handleSave = async () => {
    if (!distribution && !mean) {
      toast.error(t("validation.atLeastOne"));
      return;
    }

    if (
      showValueRange &&
      valueRange.min !== undefined &&
      valueRange.max !== undefined &&
      valueRange.min > valueRange.max
    ) {
      toast.error(t("validation.minMax"));
      return;
    }

    setIsSaving(true);
    try {
      const attributes: DatasetVariablesetItemAttributes = {
        allowedStatistics: { distribution, mean },
      };

      if (showValueRange && (valueRange.min !== undefined || valueRange.max !== undefined)) {
        attributes.valueRange = {
          min: valueRange.min ?? 0,
          max: valueRange.max ?? 0,
        };
      }

      await updateVariablesetItemAttributes(variablesetId, variableId, attributes);
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
      setDistribution(currentAttributes.allowedStatistics.distribution);
      setMean(currentAttributes.allowedStatistics.mean);
      setValueRange({
        min: currentAttributes.valueRange?.min,
        max: currentAttributes.valueRange?.max,
      });
    }
    setIsOpen(open);
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? undefined : Number(e.target.value);
    setValueRange((prev) => ({ ...prev, min: value }));
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? undefined : Number(e.target.value);
    setValueRange((prev) => ({ ...prev, max: value }));
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

          {showValueRange && (
            <div className="mt-4 space-y-3 border-t pt-4">
              <p className="text-sm font-medium">{t("valueRange.title")}</p>
              <p className="text-muted-foreground text-xs">{t("valueRange.description")}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="valueRangeMin" className="text-xs">
                    {t("valueRange.min")}
                  </Label>
                  <Input
                    id="valueRangeMin"
                    type="number"
                    value={valueRange.min ?? ""}
                    onChange={handleMinChange}
                    placeholder={t("valueRange.minPlaceholder")}
                    data-testid="admin.dataset.variableset.allowed-statistics.value-range-min"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="valueRangeMax" className="text-xs">
                    {t("valueRange.max")}
                  </Label>
                  <Input
                    id="valueRangeMax"
                    type="number"
                    value={valueRange.max ?? ""}
                    onChange={handleMaxChange}
                    placeholder={t("valueRange.maxPlaceholder")}
                    data-testid="admin.dataset.variableset.allowed-statistics.value-range-max"
                  />
                </div>
              </div>
            </div>
          )}
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
