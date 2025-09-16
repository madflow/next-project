import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { PageLayout } from "@/components/page/page-layout";
import { AdhocAnalysisWrapper } from "@/components/project/adhoc-analysis-wrapper";
import { findBySlug, hasAccess } from "@/dal/project";

type PageProps = {
  params: Promise<{
    projectSlug: string;
  }>;
};
export default async function Page({ params }: PageProps) {
  const { projectSlug } = await params;

  const t = await getTranslations("pageProjectAdhoc");

  const project = await findBySlug(projectSlug);
  if (!project) {
    return notFound();
  }

  const check = await hasAccess(project.id);

  if (!check) {
    redirect("/landing");
  }

  return (
    <PageLayout data-testid="app.project.adhoc" title={t("title")}>
      <AdhocAnalysisWrapper project={project} />
    </PageLayout>
  );
}
