import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { PageLayout } from "@/components/page/page-layout";
import { AdhocAnalysisWrapper } from "@/components/project/adhoc-analysis-wrapper";
import { isAccessDeniedAPIError } from "@/lib/api-errors";
import { getServerAPIClient } from "@/lib/server-api-client";

type PageProps = {
  params: Promise<{
    projectSlug: string;
  }>;
};
export default async function Page({ params }: PageProps) {
  const { projectSlug } = await params;
  const api = await getServerAPIClient();

  const t = await getTranslations("pageProjectAdhoc");

  let projectResult;

  try {
    projectResult = await api.project.list({ limit: "1", offset: "0", slug: projectSlug });
  } catch (error) {
    if (isAccessDeniedAPIError(error)) {
      redirect("/landing");
    }

    throw error;
  }

  const project = projectResult.rows[0] ?? null;

  if (!project) {
    return notFound();
  }

  return (
    <PageLayout data-testid="app.project.adhoc" title={t("title")}>
      <AdhocAnalysisWrapper project={project} />
    </PageLayout>
  );
}
