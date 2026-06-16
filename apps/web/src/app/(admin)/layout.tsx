import { redirect } from "next/navigation";
import { isAdminUser, isImpersonatingSession } from "@repo/auth/server";
import { AdminSidebar } from "@/components/admin-sidebar";
import { SidebarLayout } from "@/components/sidebar-layout";
import { SiteHeader } from "@/components/site-header";
import { getSession } from "@/lib/auth/session";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/auth/login");
  }

  if (isImpersonatingSession(session.session) || !isAdminUser(session.user)) {
    redirect("/");
  }

  return (
    <SidebarLayout SidebarComponent={AdminSidebar} SiteHeaderComponent={SiteHeader}>
      {children}
    </SidebarLayout>
  );
}
