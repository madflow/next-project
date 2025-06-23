"use client";

import { HouseIcon, WrenchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavPrimary } from "@/components/nav-primary";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { OrganizationSwitcher } from "./organization-switcher";
import { ProjectSwitcher } from "./project-switcher";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getNavData = (t: (t: any) => string) => ({
  navMain: [
    {
      title: t("navItems.dashboard"),
      url: "/",
      icon: HouseIcon,
    },
  ],
  navSecondary: [
    {
      title: t("navItems.admin"),
      url: "/admin",
      icon: WrenchIcon,
    },
  ],
  sections: [],
});

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations("appSidebar");
  const isAdmin = useIsAdmin();
  const data = getNavData(t);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <OrganizationSwitcher />
        <ProjectSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {data.sections.length > 0 && <NavPrimary items={data.sections} title={t("sections")} />}
        {isAdmin && <NavSecondary items={data.navSecondary} className="mt-auto" />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
