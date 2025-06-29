import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarLayout } from "@/components/sidebar-layout";

export default async function ProjectLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarLayout
      SidebarComponent={AppSidebar}
      SiteHeaderComponent={SiteHeader}
      siteHeaderTitle="Landing"
    >
      {children}
    </SidebarLayout>
  );
}
