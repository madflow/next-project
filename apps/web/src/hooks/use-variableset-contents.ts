"use client";

import { useQuery } from "@tanstack/react-query";
import { apiQuery } from "@/lib/api-client";

export type VariablesetContentEntry = {
  id: string;
  position: number;
  contentType: "variable" | "subset";
  variableId: string | null;
  subsetId: string | null;
  attributes: {
    allowedStatistics?: { distribution: boolean; mean: boolean };
    valueRange?: { min: number; max: number };
  } | null;
  // Variable fields (populated when contentType = 'variable')
  variableName: string | null;
  variableLabel: string | null;
  variableType: string | null;
  variableMeasure: string | null;
  // Subset fields (populated when contentType = 'subset')
  subsetName: string | null;
  subsetDescription: string | null;
  subsetCategory: string | null;
};

export function useVariablesetContents(variablesetId: string | null) {
  return useQuery({
    enabled: !!variablesetId,
    ...apiQuery.variableset.contents.get.queryOptions({
      input: { id: variablesetId ?? "" },
      select: (data): VariablesetContentEntry[] => data.contents || [],
    }),
  });
}
