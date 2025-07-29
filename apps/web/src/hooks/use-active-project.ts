"use client";

import { type Organization } from "better-auth/plugins";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { useProjectsByOrg } from "./use-projects-by-org";

export type Project = {
  id: string;
  name: string;
  slug: string;
  organizationId: string;
};

type PathParams = {
  projectSlug: string | null;
};

export function useActiveProject(activeOrganization?: Organization | null) {
  const [activeProjectSlug, setActiveProjectSlug] = useState<string | null>(null);
  const queryParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (activeProjectSlug) {
      params.slug = activeProjectSlug;
    }
    return params;
  }, [activeProjectSlug]);
  const { data, isLoading } = useProjectsByOrg(activeOrganization?.id || "", queryParams);

  const pathname = usePathname();

  useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const result: PathParams = {
      projectSlug: null,
    };
    const projectIndex = segments.findIndex((segment: string) => segment === "project");
    if (projectIndex !== -1 && projectIndex + 1 < segments.length) {
      setActiveProjectSlug(segments[projectIndex + 1] || null);
    }

    return result;
  }, [pathname]);

  return {
    activeProject: isLoading ? null : data?.[0],
    isLoading: isLoading || !activeOrganization,
  };
}
