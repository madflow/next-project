"use client";

import { ChartArea } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useActiveProject } from "@/hooks/use-active-project";
import { useActiveOrganization } from "@/lib/auth-client";

export function NavProject() {
  const { data: activeOrganization } = useActiveOrganization();
  const { activeProject } = useActiveProject();
  if (!activeOrganization) return null;
  if (!activeProject) return null;
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Project</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <a href={`/org/${activeOrganization.slug}/project/${activeProject.slug}`}>
              <ChartArea />
              <span>Dashboard</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
