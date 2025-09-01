import { AppSidebar } from "@/components/app-sidebar";
import { SidebarLayout } from "@/components/sidebar-layout";
import { SiteHeader } from "@/components/site-header";

export default async function ProjectLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarLayout SidebarComponent={AppSidebar} SiteHeaderComponent={SiteHeader} siteHeaderTitle="Landing">
      {children}
    </SidebarLayout>
  );
}
