import { useQuery } from "@tanstack/react-query";
import { useActiveOrganization } from "@/lib/auth-client";

export function useProjectsByOrg() {
  const { data: activeOrganization } = useActiveOrganization();
  
  return useQuery({
    queryKey: ["projects", "by-org", activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) return [];
      
      const response = await fetch(`/api/organizations/${activeOrganization.id}/projects`);
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      const data = await response.json();
      return data.rows || [];
    },
    enabled: !!activeOrganization?.id,
  });
}
