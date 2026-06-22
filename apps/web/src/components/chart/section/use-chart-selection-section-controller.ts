"use client";

import { useCallback, useMemo, useState } from "react";
import { parseCountedValue } from "@/lib/multi-response-utils";
import type { DatasetVariableWithAttributes } from "@/types/dataset-variable";
import type { VariablesetTreeNode } from "@/types/dataset-variableset";
import type { StatsResponse } from "@/types/stats";

type SplitStatsEntry = {
  splitVariable: string;
  stats: StatsResponse;
};

type UseChartSelectionSectionControllerParams = {
  variables: DatasetVariableWithAttributes[];
  baseStatsData: Record<string, StatsResponse>;
  splitStatsData: Record<string, SplitStatsEntry>;
  variableset?: VariablesetTreeNode;
  onStatsRequestAction: (variableName: string, splitVariable?: string) => void;
};

export function useChartSelectionSectionController({
  variables,
  baseStatsData,
  splitStatsData,
  variableset,
  onStatsRequestAction,
}: UseChartSelectionSectionControllerParams) {
  const [splitVariablesBySelection, setSplitVariablesBySelection] = useState<
    Record<string, Record<string, string | null>>
  >({});

  const hasAllStats = useMemo(
    () => variables.every((variable) => baseStatsData[variable.name]),
    [baseStatsData, variables]
  );

  const selectionKey = useMemo(
    () =>
      variables
        .map((variable) => variable.id)
        .sort()
        .join(","),
    [variables]
  );

  const selectedSplitVariables = useMemo(
    () => splitVariablesBySelection[selectionKey] ?? {},
    [selectionKey, splitVariablesBySelection]
  );
  const isMultiResponse = variableset?.category === "multi_response";
  const countedValue = parseCountedValue(variableset?.attributes);
  const showVariablesetHeader = Boolean(variableset && !isMultiResponse);
  const showMultiResponseAggregate = Boolean(isMultiResponse && variableset);

  const getStatsForVariable = useCallback(
    (variableName: string) => {
      const selectedSplitVariable = selectedSplitVariables[variableName];
      if (!selectedSplitVariable) {
        return baseStatsData[variableName] || null;
      }

      const splitStatsEntry = splitStatsData[variableName];
      if (splitStatsEntry?.splitVariable === selectedSplitVariable) {
        return splitStatsEntry.stats;
      }

      return baseStatsData[variableName] || null;
    },
    [baseStatsData, selectedSplitVariables, splitStatsData]
  );

  const handleSplitVariableChange = useCallback(
    (variableName: string, splitVariable: string | null) => {
      setSplitVariablesBySelection((prev) => ({
        ...prev,
        [selectionKey]: {
          ...prev[selectionKey],
          [variableName]: splitVariable,
        },
      }));

      onStatsRequestAction(variableName, splitVariable || undefined);
    },
    [onStatsRequestAction, selectionKey]
  );

  return {
    countedValue,
    getStatsForVariable,
    handleSplitVariableChange,
    hasAllStats,
    isMultiResponse,
    selectedSplitVariables,
    showMultiResponseAggregate,
    showVariablesetHeader,
  };
}
