"use client";
import { type Organization } from "better-auth/plugins";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useProjectsByOrg } from "./use-projects-by-org";

export type Project = {
  id: string;
  name: string;
  slug: string;
  organizationId: string;
};

export function useActiveProject(activeOrganization?: Organization | null) {
  const pathname = usePathname();

  // Derive project slug directly from pathname
  const activeProjectSlug = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const projectIndex = segments.findIndex((segment: string) => segment === "project");

    if (projectIndex !== -1 && projectIndex + 1 < segments.length) {
      return segments[projectIndex + 1] || null;
    }
    return null;
  }, [pathname]);

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (activeProjectSlug) {
      params.slug = activeProjectSlug;
    }
    return params;
  }, [activeProjectSlug]);

  const { data, isLoading } = useProjectsByOrg(activeOrganization?.id || "", queryParams);

  return {
    activeProject: isLoading ? null : data?.[0],
    isLoading: isLoading || !activeOrganization,
  };
}
