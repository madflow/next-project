"use client";

import { Organization } from "better-auth/plugins";
import { ChartArea } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Project } from "@/context/app-context";

type NavProjectProps = {
  activeOrganization: Organization | null;
  activeProject: Project | null;
};
export function NavProject({ activeOrganization, activeProject }: NavProjectProps) {
  if (!activeOrganization) return null;
  if (!activeProject) return null;
  if (activeProject.organizationId !== activeOrganization.id) return null;
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Project</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <a href={`/project/${activeProject.slug}`}>
              <ChartArea />
              <span>Dashboard</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
