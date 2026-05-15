import { useQuery } from "@tanstack/react-query";
import { apiQuery } from "@/lib/api-client";
import { Project } from "@/types/project";

export function useProjectsByOrg(organizationId: string, queryParams?: Record<string, string>) {
  const input = {
    id: organizationId,
    ...Object.fromEntries(Object.entries(queryParams ?? {}).filter(([, value]) => value)),
  } as { id: string } & Record<string, string>;

  return useQuery({
    enabled: !!organizationId,
    ...apiQuery.organization.projects.list.queryOptions({
      input,
      select: (data) => (data.rows || []) as Project[],
    }),
  });
}
