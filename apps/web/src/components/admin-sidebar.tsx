"use client";

import { DatabaseIcon, GanttChartIcon, HouseIcon, MenuIcon, ProjectorIcon, WrenchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavPrimary } from "@/components/nav-primary";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getNavData = (t: (t: any) => string) => ({
  navMain: [
    {
      title: t("navItems.admin"),
      url: "/admin",
      icon: WrenchIcon,
    },
  ],
  navSecondary: [
    {
      title: t("navItems.app"),
      url: "/dashboard",
      icon: HouseIcon,
    },
  ],
  documents: [
    {
      name: t("navItems.organizations"),
      url: "/admin/organizations",
      icon: DatabaseIcon,
    },
    {
      name: t("navItems.users"),
      url: "/admin/users",
      icon: GanttChartIcon,
    },
    {
      name: t("navItems.projects"),
      url: "/admin/projects",
      icon: ProjectorIcon,
    },
  ],
});

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations("adminSidebar");
  const data = getNavData(t);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <MenuIcon className="!size-5" />
            <span className="text-base font-semibold">{t("adminMenu")}</span>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavPrimary items={data.documents} title={t("sections")} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
