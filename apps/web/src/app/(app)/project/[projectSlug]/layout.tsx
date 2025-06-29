import { AppSidebar } from "@/components/app-sidebar";
import { ProjectSiteHeader } from "@/components/project-site-header";
import { SidebarLayout } from "@/components/sidebar-layout";

export default async function ProjectLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarLayout
      SidebarComponent={AppSidebar}
      SiteHeaderComponent={ProjectSiteHeader}
    >
      {children}
    </SidebarLayout>
  );
}
