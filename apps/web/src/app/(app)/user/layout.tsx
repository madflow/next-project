import { SiteHeader } from "@/components/site-header";
import { SidebarLayout } from "@/components/sidebar-layout";
import { UserSidebar } from "@/components/user-sidebar";

export default async function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarLayout
      SidebarComponent={UserSidebar}
      SiteHeaderComponent={SiteHeader}
      siteHeaderTitle="User"
    >
      {children}
    </SidebarLayout>
  );
}
