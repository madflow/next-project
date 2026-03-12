"use client";

import { useQuery } from "@tanstack/react-query";

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
    queryKey: ["variableset-contents", variablesetId],
    queryFn: async (): Promise<VariablesetContentEntry[]> => {
      if (!variablesetId) return [];

      const response = await fetch(`/api/variablesets/${variablesetId}/contents`);
      if (!response.ok) {
        throw new Error("Failed to fetch variableset contents");
      }
      const data = await response.json();
      return data.contents || [];
    },
    enabled: !!variablesetId,
  });
}
