import { getTranslations } from "next-intl/server";
import { redirect, RedirectType } from "next/navigation";
import { PageLayout } from "@/components/page/page-layout";
import { getUserOrganizations } from "@/dal/organization";
import { getUserProjects } from "@/dal/project";

export default async function Dashboard() {
  const t = await getTranslations("pageLanding");

  // Check if user has exactly one organization and one project
  const organizations = await getUserOrganizations();
  const projects = await getUserProjects();

  // If user has exactly one organization and one project, redirect to that project
  if (organizations.length === 1 && projects.length === 1) {
    const project = projects[0];
    if (project) {
      redirect(`/project/${project.slug}`, RedirectType.replace);
    }
  }

  return <PageLayout data-testid="app.landing.page">{t("title")}</PageLayout>;
}
