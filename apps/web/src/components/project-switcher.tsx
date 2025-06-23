"use client";

import { Folder, ChevronsUpDown, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { useActiveOrganization } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useProjectsByOrg } from "@/hooks/use-projects-by-org";
import { useActiveProject } from "@/hooks/use-active-project";
import { SidebarMenu, SidebarMenuItem } from "./ui/sidebar";

type Project = {
  id: string;
  name: string;
  slug: string;
  organizationId: string;
};

export function ProjectSwitcher() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { data: activeOrganization } = useActiveOrganization();
  const { data: projects = [], isLoading: isProjectsLoading } = useProjectsByOrg();
  const { activeProject, setActiveProject, isLoading: isActiveProjectLoading } = useActiveProject();
  const [isSwitching, setIsSwitching] = useState(false);
  
  // Filter projects to only show those for the active organization
  const filteredProjects = projects.filter(
    (project: Project) => project.organizationId === activeOrganization?.id
  );
  
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
      router.refresh();
    } catch (error) {
      console.error("Failed to switch project", error);
      toast.error("Failed to switch project");
    } finally {
      setIsSwitching(false);
    }
  };

  const isLoading = isProjectsLoading || isSwitching || isActiveProjectLoading;
  const displayName = activeProject?.name || "Select project";
  const isProjectFromCurrentOrg = activeProject?.organizationId === activeOrganization?.id;

  if (!activeOrganization) {
    return null; // Don't show project switcher if no org is selected
  }

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <Button variant="ghost" size="sm" className="w-full justify-start" disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Loading projects...</span>
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
                    <Folder className="h-4 w-4" />
                    <span className="truncate">{project.name}</span>
                  </div>
                </DropdownMenuItem>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No projects found
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
