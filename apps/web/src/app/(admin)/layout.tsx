import { AdminSidebar } from "@/components/admin-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarLayout } from "@/components/sidebar-layout";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarLayout
      SidebarComponent={AdminSidebar}
      SiteHeaderComponent={SiteHeader}
    >
      {children}
    </SidebarLayout>
  );
}
