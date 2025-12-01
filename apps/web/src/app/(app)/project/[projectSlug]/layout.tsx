import { AppContextInitializer } from "@/components/app-context-initializer";
import { AppSidebar } from "@/components/app-sidebar";
import { ProjectSiteHeader } from "@/components/project-site-header";
import { SidebarLayout } from "@/components/sidebar-layout";
import { getInitialAppContext } from "@/lib/get-initial-app-context";

export default async function ProjectLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ projectSlug: string }>;
}>) {
  const { projectSlug } = await params;
  const { organization, project } = await getInitialAppContext(projectSlug);

  return (
    <>
      <AppContextInitializer organization={organization} project={project} />
      <SidebarLayout SidebarComponent={AppSidebar} SiteHeaderComponent={ProjectSiteHeader}>
        {children}
      </SidebarLayout>
    </>
  );
}
