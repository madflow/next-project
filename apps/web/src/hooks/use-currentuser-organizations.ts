import { useQuery } from "@tanstack/react-query";
import { apiQuery } from "@/lib/api-client";
import { Organization } from "@/types/organization";

export function useCurrentuserOrganizations() {
  return useQuery({
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    ...apiQuery.currentuser.organizations.list.queryOptions({
      input: {},
      select: (data) => data as Organization[],
    }),
  });
}
