import { useQuery } from "@tanstack/react-query";
import { apiQuery } from "@/lib/api-client";
import { Organization } from "@/types/organization";

export function useOrganizations(queryParams?: Record<string, string>) {
  const input = Object.fromEntries(Object.entries(queryParams ?? {}).filter(([, value]) => value)) as Record<
    string,
    string
  >;

  return useQuery({
    ...apiQuery.organization.list.queryOptions({
      input,
      select: (data) => (data.rows || []) as Organization[],
    }),
  });
}
