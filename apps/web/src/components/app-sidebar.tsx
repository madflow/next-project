"use client";

import { WrenchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import * as React from "react";
import { NavPrimary } from "@/components/nav-primary";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
import { Project, useAppContext } from "@/context/app-context";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { NavProject } from "./nav-project";
import { OrganizationMenu } from "./organization-menu";
import { ProjectSwitcher } from "./project-switcher";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getNavData = (t: (t: any) => string) => ({
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
  const router = useRouter();
  const { activeOrganization, activeProject, setActiveProject } = useAppContext();

  function handleSelectProject(project: Project) {
    router.push(`/project/${project.slug}/adhoc`);
    setActiveProject(project);
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <OrganizationMenu activeOrganization={activeOrganization} />
        <ProjectSwitcher
          organizationId={activeOrganization?.id ?? ""}
          activeProject={activeProject}
          onSelect={handleSelectProject}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavProject activeProject={activeProject} activeOrganization={activeOrganization} />
        {data.sections.length > 0 && <NavPrimary items={data.sections} title={t("sections")} />}
        {isAdmin && <NavSecondary items={data.navSecondary} className="mt-auto" />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
