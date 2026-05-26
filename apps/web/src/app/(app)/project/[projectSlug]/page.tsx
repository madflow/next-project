import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { PageLayout } from "@/components/page/page-layout";
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

  const t = await getTranslations("pageProjectLanding");
  return <PageLayout data-testid="app.project.landing">{t("title")}</PageLayout>;
}
