"use client";

import { CircleHelpIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getVariableLabel } from "@/lib/variable-helpers";
import type { DatasetVariableWithAttributes } from "@/types/dataset-variable";
import { useSplitVariables } from "../chart/split-variable/use-split-variables";

type SplitVariableSelectorProps = {
  datasetId: string;
  selectedSplitVariable: string | null;
  onSplitVariableChangeAction: (splitVariable: string | null) => void;
  compact?: boolean;
  splitVariables?: DatasetVariableWithAttributes[];
  isLoading?: boolean;
};

export function SplitVariableSelector({
  datasetId,
  selectedSplitVariable,
  onSplitVariableChangeAction,
  compact = false,
  splitVariables: splitVariablesProp,
  isLoading: isLoadingProp,
}: SplitVariableSelectorProps) {
  const t = useTranslations("projectAdhocAnalysis.splitVariable");
  const splitVariableSelectId = `${useId()}-split-variable-select`;
  const shouldFetch = splitVariablesProp === undefined || isLoadingProp === undefined;
  const queryResult = useSplitVariables(datasetId, shouldFetch);
  const splitVariables = splitVariablesProp ?? queryResult.splitVariables;
  const isLoading = isLoadingProp ?? queryResult.isLoading;

  const handleValueChange = (value: string) => {
    if (value === "none") {
      onSplitVariableChangeAction(null);
    } else {
      onSplitVariableChangeAction(value);
    }
  };

  // Get the label for the selected variable (without variable name)
  const getSelectedLabel = () => {
    if (!selectedSplitVariable) return t("none");
    const selectedVar = splitVariables.find((v) => v.name === selectedSplitVariable);
    return selectedVar ? getVariableLabel(selectedVar) : selectedSplitVariable;
  };

  return (
    <div className={compact ? "flex items-center gap-2" : "space-y-1"}>
      <div className="flex items-center gap-2">
        <Label htmlFor={splitVariableSelectId} className="min-w-fit text-sm font-medium">
          {t("label")}
        </Label>
        <Tooltip>
          <TooltipTrigger render={<button type="button" className="cursor-help" />}>
            <CircleHelpIcon className="text-muted-foreground h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("tooltip")}</p>
          </TooltipContent>
        </Tooltip>
        <Select
          value={selectedSplitVariable || "none"}
          onValueChange={(value) => {
            if (value) {
              handleValueChange(value);
            }
          }}>
          <SelectTrigger
            id={splitVariableSelectId}
            className={compact ? "h-8 w-auto max-w-[250px] min-w-[180px]" : "h-8 flex-1"}>
            <SelectValue placeholder={t("placeholder")}>
              <span className="truncate">{getSelectedLabel()}</span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t("none")}</SelectItem>
            {isLoading && (
              <SelectItem value="loading" disabled>
                {"Loading..."}
              </SelectItem>
            )}
            {splitVariables.map((variable) => (
              <SelectItem key={variable.id} value={variable.name}>
                {getVariableLabel(variable)} {"("}
                {variable.name}
                {")"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
