import { useQuery } from "@tanstack/react-query";
import { Organization } from "@/types/organization";

export function useCurrentuserOrganizations() {
  return useQuery({
    queryKey: ["currentuser", "organizations"],
    queryFn: async () => {
      const url = `/api/currentuser/organizations`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch organizations");
      }
      const data = (await response.json()) as Organization[];
      return data || [];
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}
