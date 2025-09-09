"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueryApi } from "@/hooks/use-query-api";
import type { DatasetVariable } from "@/types/dataset-variable";

type SplitVariableSelectorProps = {
  datasetId: string;
  selectedSplitVariable: string | null;
  onSplitVariableChangeAction: (splitVariable: string | null) => void;
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
}: SplitVariableSelectorProps) {
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

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Label htmlFor="split-variable-select" className="text-sm font-medium min-w-fit">
          {"Split Variable:"}
        </Label>
        <Select
          value={selectedSplitVariable || "none"}
          onValueChange={handleValueChange}
        >
          <SelectTrigger id="split-variable-select" className="h-8 flex-1">
            <SelectValue placeholder={"Choose split variable..."} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              {"None"}
            </SelectItem>
            {isLoading && (
              <SelectItem value="loading" disabled>
                {"Loading..."}
              </SelectItem>
            )}
            {splitVariables.map((variable) => (
              <SelectItem key={variable.id} value={variable.name}>
                {variable.label} {"("}{variable.name}{")"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {selectedSplitVariable && (
        <p className="text-xs text-muted-foreground ml-0">
          {"Charts will be split by categories of this variable."}
        </p>
      )}
    </div>
  );
}