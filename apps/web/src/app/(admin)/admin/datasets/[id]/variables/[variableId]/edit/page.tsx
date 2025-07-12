import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { find } from "@/dal/dataset-variable";
import { EditDatasetVariableForm } from "@/components/admin/dataset-variable/edit-dataset-variable-form";
import { PageLayout } from "@/components/page/page-layout";

type PageProps = {
  params: Promise<{
    id: string; // datasetId
    variableId: string;
  }>;
};

export default async function EditDatasetVariablePage(props: PageProps) {
  const params = await props.params;
  const { id: datasetId, variableId } = params;
  const t = await getTranslations("adminDatasetEditor");

  const datasetVariable = await find(variableId);

  if (!datasetVariable) {
    return notFound();
  }

  // Ensure the variable belongs to the specified dataset
  if (datasetVariable.datasetId !== datasetId) {
    return notFound();
  }

  return (
    <PageLayout title={t("editVariable.title")} description={t("editVariable.description")}>
      <EditDatasetVariableForm 
        datasetVariable={{
          ...datasetVariable,
          datasetId
        }} 
      />
    </PageLayout>
  );
}
