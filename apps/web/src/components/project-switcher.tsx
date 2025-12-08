"use client";

import { ChevronsUpDown, Folder, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Project } from "@/context/app-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { useProjectsByOrg } from "@/hooks/use-projects-by-org";
import { cn } from "@/lib/utils";
import { SidebarMenu, SidebarMenuItem } from "./ui/sidebar";

type ProjectSwitcherProps = {
  activeProject: Project | null;
  organizationId: string;
  onSelect: (project: Project) => void;
};

export function ProjectSwitcher({ activeProject, organizationId, onSelect }: ProjectSwitcherProps) {
  const isMobile = useIsMobile();
  const { data: projects = [], isLoading: isProjectsLoading } = useProjectsByOrg(organizationId);
  const [isSwitching, setIsSwitching] = useState(false);
  const t = useTranslations("appSidebar");

  const handleSelect = async (project: Project) => {
    if (project.id === activeProject?.id) return;

    setIsSwitching(true);
    try {
      onSelect(project);
    } catch (error) {
      console.error("Failed to switch project", error);
      toast.error("Failed to switch project");
    } finally {
      setIsSwitching(false);
    }
  };

  const displayName = activeProject?.name || t("projectSwitcher.label");

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={projects.length === 0 || isProjectsLoading}>
            <Button
              variant="ghost"
              data-testid="app.project-switcher"
              size="sm"
              className={cn("w-full justify-between px-3", "hover:bg-accent hover:text-accent-foreground")}>
              <div className="flex items-center gap-2">
                {isProjectsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Folder className="h-4 w-4" />}
                <span className="max-w-[140px] truncate">{displayName}</span>
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            data-testid="app.project-switcher.menu"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}>
            <div className="text-muted-foreground px-2 py-1.5 text-sm font-medium">{t("projectSwitcher.switch")}</div>
            {projects.length > 0 ? (
              projects.map((project: Project) => (
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
