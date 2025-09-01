import { AdminSidebar } from "@/components/admin-sidebar";
import { SidebarLayout } from "@/components/sidebar-layout";
import { SiteHeader } from "@/components/site-header";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarLayout SidebarComponent={AdminSidebar} SiteHeaderComponent={SiteHeader}>
      {children}
    </SidebarLayout>
  );
}
