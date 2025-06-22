import { getTranslations } from "next-intl/server";
import { CreateProjectForm } from "@/components/admin/project/create-project-form";
import { PageLayout } from "@/components/page/page-layout";

export default async function NewProjectPage() {
  const t = await getTranslations("project");
  return (
    <PageLayout title={t("create.title")} description={t("create.description")} data-testid="admin.projects.new.page">
      <CreateProjectForm />
    </PageLayout>
  );
}
