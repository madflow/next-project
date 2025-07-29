import { useQuery } from "@tanstack/react-query";
import { Organization } from "@/types/organization";

export function useOrganizations(queryParams?: Record<string, string>) {
  const apiQueryParams = new URLSearchParams(queryParams || {});
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value) {
        apiQueryParams.set(key, value);
      }
    }
  }

  return useQuery({
    queryKey: ["organizations", apiQueryParams.size > 0 && apiQueryParams.toString()],
    queryFn: async () => {
      const queryString = apiQueryParams ? `?${apiQueryParams.toString()}` : "";
      const url = `/api/organizations${queryString}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch organizations");
      }
      const data = (await response.json()) as { rows: Organization[] };
      return data.rows || [];
    },
  });
}