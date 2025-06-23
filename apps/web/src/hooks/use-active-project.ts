import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { useActiveOrganization } from "@/lib/auth-client";

const ACTIVE_PROJECT_KEY = "activeProject";

type Project = {
  id: string;
  name: string;
  slug: string;
  organizationId: string;
};

export function useActiveProject() {
  const router = useRouter();

  const queryClient = useQueryClient();
  const { data: activeOrganization } = useActiveOrganization();
  
  const { data: activeProject, isLoading } = useQuery<Project | null>({
    queryKey: [ACTIVE_PROJECT_KEY],
    queryFn: () => {
      if (typeof window === "undefined") return null;
      const project = localStorage.getItem(ACTIVE_PROJECT_KEY);
      return project ? JSON.parse(project) : null;
    },
  });
  
  // Reset active project when organization changes
  useEffect(() => {
    if (activeOrganization?.id && activeProject?.organizationId !== activeOrganization.id) {
      localStorage.removeItem(ACTIVE_PROJECT_KEY);
      queryClient.setQueryData([ACTIVE_PROJECT_KEY], null);
    }
  }, [activeOrganization?.id, activeProject?.organizationId, queryClient]);

  const setActiveProject = useCallback(
    async (project: Project | null) => {
      if (project) {
        localStorage.setItem(ACTIVE_PROJECT_KEY, JSON.stringify(project));
        queryClient.setQueryData([ACTIVE_PROJECT_KEY], project);
      } else {
        localStorage.removeItem(ACTIVE_PROJECT_KEY);
        queryClient.setQueryData([ACTIVE_PROJECT_KEY], null);
      }
      // Refresh the page to update the UI
      router.refresh();
    },
    [router, queryClient]
  );

  return {
    activeProject,
    setActiveProject,
    isLoading,
  };
}
