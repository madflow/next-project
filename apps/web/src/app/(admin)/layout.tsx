import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin-sidebar";
import { SidebarLayout } from "@/components/sidebar-layout";
import { SiteHeader } from "@/components/site-header";
import { USER_ADMIN_ROLE, auth } from "@/lib/auth";

type SessionWithImpersonation = {
  impersonatedBy?: string | null;
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth/login");
  }

  const isImpersonating = Boolean((session.session as SessionWithImpersonation | undefined)?.impersonatedBy);

  if (isImpersonating || session.user.role !== USER_ADMIN_ROLE) {
    redirect("/");
  }

  return (
    <SidebarLayout SidebarComponent={AdminSidebar} SiteHeaderComponent={SiteHeader}>
      {children}
    </SidebarLayout>
  );
}
