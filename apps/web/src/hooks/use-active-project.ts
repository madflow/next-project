"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";
import { useActiveOrganization } from "@/lib/auth-client";
import {
  getActiveProject,
  setActiveProject as setStorageActiveProject,
  clearActiveProject,
  APP_CONTEXT_KEY,
} from "@/lib/utils";

export type Project = {
  id: string;
  name: string;
  slug: string;
  organizationId: string;
};

const ACTIVE_PROJECT_QUERY_KEY = [APP_CONTEXT_KEY, 'activeProject'] as const;

export function useActiveProject() {
  const queryClient = useQueryClient();
  const { data: activeOrganization } = useActiveOrganization();
  
  const queryKey = useMemo(
    () => [...ACTIVE_PROJECT_QUERY_KEY, activeOrganization?.id],
    [activeOrganization?.id]
  );
  
  const { data: activeProject, isLoading } = useQuery<Project | null>({
    queryKey,
    queryFn: () => {
      if (!activeOrganization?.id) return null;
      return getActiveProject(activeOrganization.id);
    },
    enabled: !!activeOrganization?.id,
  });
  
  // Reset active project when organization changes
  useEffect(() => {
    if (activeOrganization?.id && activeProject?.organizationId !== activeOrganization.id) {
      clearActiveProject();
      queryClient.setQueryData(queryKey, null);
    }
  }, [activeOrganization?.id, activeProject?.organizationId, queryClient, queryKey]);

  const setActiveProject = useCallback(
    async (project: Project | null) => {
      if (project) {
        setStorageActiveProject(project);
        queryClient.setQueryData(queryKey, project);
      } else {
        clearActiveProject();
        queryClient.setQueryData(queryKey, null);
      }
    },
    [queryClient, queryKey]
  );

  return {
    activeProject: activeOrganization?.id === activeProject?.organizationId ? activeProject : null,
    setActiveProject,
    isLoading: isLoading || !activeOrganization,
  };
}
