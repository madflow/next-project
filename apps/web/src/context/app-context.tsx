"use client";

import { type Organization } from "@/types/organization";
import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { useActiveProject } from "@/hooks/use-active-project";
import { useActiveOrganization } from "@/lib/auth-client";

export type Project = {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
};

type AppContextType = {
  activeOrganization: Organization | null;
  activeProject: Project | null;
  setActiveOrganization: (org: Organization | null) => void;
  setActiveProject: (project: Project | null) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeOrganization, setActiveOrganization] = useState<Organization | null>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const { data: activeOrganizationSession } = useActiveOrganization();
  const { activeProject: activeProjectDetected } = useActiveProject(activeOrganization);

  useEffect(() => {
    async function detectContext() {
      if (activeOrganizationSession) {
        setActiveOrganization({
          ...activeOrganizationSession,
          logo: activeOrganizationSession.logo === undefined ? null : activeOrganizationSession.logo,
          metadata: activeOrganizationSession.metadata === undefined ? null : activeOrganizationSession.metadata,
        });
        if (activeProject && activeProject.organizationId !== activeOrganizationSession.id) {
          setActiveProject(null);
        } else if (activeProjectDetected && !activeProject) {
          setActiveProject(activeProjectDetected);
        } else if (activeProjectDetected && activeProject) {
          if (activeProjectDetected.id !== activeProject.id) {
            setActiveProject(activeProjectDetected);
          }
        }
      }
    }

    detectContext();
  }, [activeOrganizationSession, activeProject, activeProjectDetected]);

  return (
    <AppContext.Provider
      value={{
        activeOrganization,
        activeProject,
        setActiveOrganization,
        setActiveProject,
      }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
