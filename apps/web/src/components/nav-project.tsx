"use client";

import { Organization } from "better-auth/plugins";
import { PieChart } from "lucide-react";
import { useTranslations } from "next-intl";
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
          <SidebarMenuButton asChild>
            <a href={`/project/${activeProject.slug}/adhoc`}>
              <PieChart />
              <span>{t("navItems.adhoc")}</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
