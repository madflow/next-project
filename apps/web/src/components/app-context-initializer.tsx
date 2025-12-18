"use client";

import { Organization } from "better-auth/plugins";
import { useEffect } from "react";
import { useAppContext } from "@/context/app-context";
import { Project } from "@/types/project";

type AppContextInitializerProps = {
  organization: Organization | null;
  project: Project | null;
};

/**
 * Client component that initializes the AppContext with server-fetched values.
 * This ensures the sidebar has the correct organization and project selected
 * on first load, avoiding race conditions.
 */
export function AppContextInitializer({ organization, project }: AppContextInitializerProps) {
  const { setActiveOrganization, setActiveProject } = useAppContext();

  useEffect(() => {
    if (organization) {
      setActiveOrganization(organization);
    }
    if (project) {
      setActiveProject(project);
    }
  }, [organization, project, setActiveOrganization, setActiveProject]);

  return null;
}
