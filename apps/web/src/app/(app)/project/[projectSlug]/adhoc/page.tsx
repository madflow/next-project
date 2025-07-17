import { notFound, redirect } from "next/navigation";
import { ActiveThemeProvider } from "@/components/active-theme";
import { PageLayout } from "@/components/page/page-layout";
import { AdHocAnalysis } from "@/components/project/adhoc-analysis";
import { findBySlug, hasAccess } from "@/dal/project";

type PageProps = {
  params: Promise<{
    projectSlug: string;
  }>;
};
export default async function Page({ params }: PageProps) {
  const { projectSlug } = await params;

  const project = await findBySlug(projectSlug);
  if (!project) {
    return notFound();
  }

  const check = await hasAccess(project.id);

  if (!check) {
    redirect("/landing");
  }

  return (
    <PageLayout data-testid="app.project.adhoc" title="AdHoc Analysis">
      <ActiveThemeProvider>
        <AdHocAnalysis project={project} />
      </ActiveThemeProvider>
    </PageLayout>
  );
}
