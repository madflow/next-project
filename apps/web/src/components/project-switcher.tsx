"use client";

import { ChevronsUpDown, Folder, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useActiveProject } from "@/hooks/use-active-project";
import { useIsMobile } from "@/hooks/use-mobile";
import { useProjectsByOrg } from "@/hooks/use-projects-by-org";
import { useActiveOrganization } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { SidebarMenu, SidebarMenuItem } from "./ui/sidebar";

type Project = {
  id: string;
  name: string;
  slug: string;
  organizationId: string;
};

export function ProjectSwitcher() {
  // No need for router since we're not using it
  const isMobile = useIsMobile();
  const { data: activeOrganization } = useActiveOrganization();
  const { data: projects = [], isLoading: isProjectsLoading } = useProjectsByOrg();
  const { activeProject, setActiveProject, isLoading: isActiveProjectLoading } = useActiveProject();
  const [isSwitching, setIsSwitching] = useState(false);
  const t = useTranslations("appSidebar");

  // Filter projects to only show those for the active organization
  const filteredProjects = projects.filter((project: Project) => project.organizationId === activeOrganization?.id);

  // Reset active project if it doesn't belong to current org
  useEffect(() => {
    if (activeProject && activeProject.organizationId !== activeOrganization?.id) {
      setActiveProject(null);
    }
  }, [activeProject, activeOrganization?.id, setActiveProject]);

  const handleSelect = async (project: Project) => {
    if (project.id === activeProject?.id) return;

    setIsSwitching(true);
    try {
      await setActiveProject(project);
    } catch (error) {
      console.error("Failed to switch project", error);
      toast.error("Failed to switch project");
    } finally {
      setIsSwitching(false);
    }
  };

  const isLoading = isProjectsLoading || isSwitching || isActiveProjectLoading;
  const displayName = activeProject?.name || t("projectSwitcher.label");
  // Removed unused variable isProjectFromCurrentOrg

  if (!activeOrganization) {
    return null; // Don't show project switcher if no org is selected
  }

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <Button variant="ghost" size="sm" className="w-full justify-start" disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>{t("projectSwitcher.loading")}</span>
          </Button>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={isLoading || filteredProjects.length === 0}>
            <Button
              variant="ghost"
              data-testid="app.project-switcher"
              size="sm"
              className={cn("w-full justify-between px-3", "hover:bg-accent hover:text-accent-foreground")}>
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                <span className="max-w-[140px] truncate">{displayName}</span>
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}>
            <div className="text-muted-foreground px-2 py-1.5 text-sm font-medium">{t("projectSwitcher.switch")}</div>
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project: Project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => handleSelect(project)}
                  className={cn(
                    "cursor-pointer px-3 py-2 text-sm",
                    "focus:bg-accent focus:text-accent-foreground",
                    activeProject?.id === project.id && "bg-accent/50"
                  )}>
                  <div className="flex items-center gap-2">
                    {activeProject?.id === project.id && isSwitching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Folder className="h-4 w-4" />
                    )}
                    <span className="truncate">{project.name}</span>
                  </div>
                </DropdownMenuItem>
              ))
            ) : (
              <div className="text-muted-foreground px-3 py-2 text-sm">{t("projectSwitcher.noProjects")}</div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
