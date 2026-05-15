"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { getStatsResponseItem, isSplitVariableStats } from "@/lib/analysis-bridge";
import { apiQuery } from "@/lib/api-client";
import { buildCollectionQueryInput } from "@/lib/collection-query";
import { getVariableLabel } from "@/lib/variable-helpers";
import { type DatasetVariableWithAttributes } from "@/types/dataset-variable";
import { type StatsResponse } from "@/types/stats";

export function useSplitVariables(datasetId?: string, enabled: boolean = true) {
  const { data, isLoading } = useQuery({
    enabled: Boolean(datasetId) && enabled,
    ...apiQuery.dataset.splitVariables.list.queryOptions({
      input: buildCollectionQueryInput({
        input: { embed: "variable", id: datasetId ?? "" },
        pagination: { pageIndex: 0, pageSize: 100 },
        search: "",
        sorting: [{ desc: false, id: "variable:name" }],
      }),
    }),
  });

  return {
    splitVariables: data?.rows.flatMap((row) => (row.variable ? [row.variable] : [])) ?? [],
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
