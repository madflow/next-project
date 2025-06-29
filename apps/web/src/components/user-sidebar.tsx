"use client";

import { HouseIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { NavMain } from "@/components/nav-main";
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
      title: t("navItems.app"),
      url: "/landing",
      icon: HouseIcon,
    },
  ],
});

export function UserSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations("adminSidebar");
  const data = getNavData(t);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2"></SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
