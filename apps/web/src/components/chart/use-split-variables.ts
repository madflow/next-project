"use client";

import { useTranslations } from "next-intl";
import { useQueryApi } from "@/hooks/use-query-api";
import { getStatsResponseItem, isSplitVariableStats } from "@/lib/analysis-bridge";
import { getVariableLabel } from "@/lib/variable-helpers";
import { type DatasetVariableWithAttributes } from "@/types/dataset-variable";
import { type StatsResponse } from "@/types/stats";

type SplitVariablesResponse = {
  rows: DatasetVariableWithAttributes[];
};

export function useSplitVariables(datasetId?: string, enabled: boolean = true) {
  const { data, isLoading } = useQueryApi<SplitVariablesResponse>({
    endpoint: `/api/datasets/${datasetId}/splitvariables`,
    pagination: { pageIndex: 0, pageSize: 100 },
    sorting: [],
    search: "",
    queryKey: ["dataset-split-variables", datasetId],
    enabled: Boolean(datasetId) && enabled,
  });

  return {
    splitVariables: data?.rows ?? [],
    isLoading,
  };
}

export function getSplitVariableLabel(
  variable: DatasetVariableWithAttributes,
  stats: StatsResponse,
  splitVariables: DatasetVariableWithAttributes[]
) {
  const targetVariable = getStatsResponseItem(stats, variable.name);
  if (!targetVariable || !isSplitVariableStats(targetVariable.stats)) {
    return null;
  }

  const splitVariableName = targetVariable.stats.split_variable;
  const splitVariable = splitVariables.find((item) => item.name === splitVariableName);

  return splitVariable ? getVariableLabel(splitVariable) : splitVariableName;
}

export function useSplitVariableDescription(
  variable: DatasetVariableWithAttributes,
  stats: StatsResponse,
  splitVariables: DatasetVariableWithAttributes[]
) {
  const t = useTranslations("projectAdhocAnalysis");
  const splitVariableLabel = getSplitVariableLabel(variable, stats, splitVariables);

  if (!splitVariableLabel) {
    return null;
  }

  return t("splitBy", { variable: splitVariableLabel });
}
