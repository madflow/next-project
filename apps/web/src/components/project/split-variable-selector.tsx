"use client";

import { CircleHelpIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useQueryApi } from "@/hooks/use-query-api";
import { getVariableLabel } from "@/lib/variable-helpers";
import type { DatasetVariable } from "@/types/dataset-variable";

type SplitVariableSelectorProps = {
  datasetId: string;
  selectedSplitVariable: string | null;
  onSplitVariableChangeAction: (splitVariable: string | null) => void;
  compact?: boolean;
};

interface ApiResponse {
  rows: DatasetVariable[];
  count: number;
  limit: number;
  offset: number;
}

export function SplitVariableSelector({
  datasetId,
  selectedSplitVariable,
  onSplitVariableChangeAction,
  compact = false,
}: SplitVariableSelectorProps) {
  const t = useTranslations("projectAdhocAnalysis.splitVariable");

  const { data: splitVariablesResponse, isLoading } = useQueryApi<ApiResponse>({
    endpoint: `/api/datasets/${datasetId}/splitvariables`,
    pagination: { pageIndex: 0, pageSize: 100 },
    sorting: [],
    search: "",
    queryKey: ["dataset-split-variables", datasetId],
  });

  const splitVariables = splitVariablesResponse?.rows || [];

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
        <Label htmlFor="split-variable-select" className="min-w-fit text-sm font-medium">
          {t("label")}
        </Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <CircleHelpIcon className="text-muted-foreground h-4 w-4 cursor-help" />
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("tooltip")}</p>
          </TooltipContent>
        </Tooltip>
        <Select value={selectedSplitVariable || "none"} onValueChange={handleValueChange}>
          <SelectTrigger
            id="split-variable-select"
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
