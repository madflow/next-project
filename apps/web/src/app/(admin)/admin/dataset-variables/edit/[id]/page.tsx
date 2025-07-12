import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { EditDatasetVariableForm } from "@/components/admin/dataset-variable/edit-dataset-variable-form";
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
  const datasetVariable = await find(id);

  if (!datasetVariable) {
    console.error("Error: Dataset variable not found");
    notFound();
  }

  const t = await getTranslations("adminDatasetEditor");

  return (
    <PageLayout 
      title={t("editVariable.title")} 
      description={t("editVariable.description")} 
      data-testid="admin.dataset-variables.edit.page"
    >
      <EditDatasetVariableForm datasetVariable={{
        ...datasetVariable,
        datasetId: datasetVariable.datasetId || "" // Ensure datasetId is always a string
      }} />
    </PageLayout>
  );
}
