import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { DatasetVariable } from "@repo/database/schema";
import { EditDatasetVariableForm } from "@/components/admin/dataset-editor/edit-dataset-variable-form";
import { PageLayout } from "@/components/page/page-layout";
import { find } from "@/dal/dataset-variable";

type EditDatasetVariablePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditDatasetVariablePage({ params }: EditDatasetVariablePageProps) {
  const { id } = await params;

  // Fetch the dataset variable data
  const datasetVariable = (await find(id)) as DatasetVariable;

  if (!datasetVariable) {
    notFound();
  }

  const t = await getTranslations("adminDatasetEditor");

  return (
    <PageLayout
      title={t("editVariable.title")}
      description={t("editVariable.description")}
      data-testid="admin.dataset-variables.edit.page">
      <EditDatasetVariableForm datasetVariable={datasetVariable} />
    </PageLayout>
  );
}
