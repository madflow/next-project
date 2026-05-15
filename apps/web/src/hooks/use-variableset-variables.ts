import { useQuery } from "@tanstack/react-query";
import { apiQuery } from "@/lib/api-client";

export function useVariablesetVariables(variablesetId: string | null) {
  return useQuery({
    enabled: !!variablesetId,
    ...apiQuery.variableset.variables.list.queryOptions({
      input: { id: variablesetId ?? "" },
    }),
  });
}
