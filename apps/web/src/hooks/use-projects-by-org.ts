import { useQuery } from "@tanstack/react-query";

export type Project = {
  id: string;
  name: string;
  slug: string;
  organizationId: string;
};

export function useProjectsByOrg(organizationId: string, queryParams?: Record<string, string>) {
  const apiQueryParams = new URLSearchParams(queryParams || {});
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value) {
        apiQueryParams.set(key, value);
      }
    }
  }

  return useQuery({
    queryKey: ["projects", "by-org", organizationId, apiQueryParams.size > 0 && apiQueryParams.toString()],
    queryFn: async () => {
      const queryString = apiQueryParams ? `?${apiQueryParams.toString()}` : "";
      const url = `/api/organizations/${organizationId}/projects${queryString}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      const data = await response.json();
      return data.rows || [];
    },
    enabled: !!organizationId,
  });
}
