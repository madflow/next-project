"use client";

import { PieChart } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@repo/ui/components/sidebar";
import type { AuthOrganization } from "@/lib/auth/types";
import { type Project } from "@/types/project";

type NavProjectProps = {
  activeOrganization: AuthOrganization | null;
  activeProject: Project | null;
};
export function NavProject({ activeOrganization, activeProject }: NavProjectProps) {
  const t = useTranslations("appSidebar");
  if (!activeOrganization) return null;
  if (!activeProject) return null;
  if (activeProject.organizationId !== activeOrganization.id) return null;
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{t("sections")}</SidebarGroupLabel>
      <SidebarMenu>
        {/* <SidebarMenuItem> */}
        {/*   <SidebarMenuButton asChild> */}
        {/*     <a href={`/project/${activeProject.slug}`}> */}
        {/*       <LayoutTemplate /> */}
        {/*       <span>{t("navItems.dashboard")}</span> */}
        {/*     </a> */}
        {/*   </SidebarMenuButton> */}
        {/* </SidebarMenuItem> */}
        <SidebarMenuItem>
          <SidebarMenuButton render={<a href={`/project/${activeProject.slug}/adhoc`} />}>
            <PieChart />
            <span>{t("navItems.adhoc")}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
