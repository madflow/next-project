import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { EditProjectForm } from "@/components/admin/project/edit-project-form";
import { PageLayout } from "@/components/page/page-layout";
import { find } from "@/dal/project";

type EditProjectPageProps = {
  params: Promise<{
    id: string;
  }>;
};
export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { id } = await params;
  const project = await find(id);

  if (!project) {
    notFound();
  }

  const t = await getTranslations("project");

  return (
    <PageLayout title={t("edit.title")} description={t("edit.description")} data-testid="admin.projects.edit.page">
      <EditProjectForm project={project} />
    </PageLayout>
  );
}
