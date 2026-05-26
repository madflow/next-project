import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { DatasetVariable } from "@repo/database/schema";
import { EditDatasetVariableForm } from "@/components/admin/dataset-editor/edit-dataset-variable-form";
import { PageLayout } from "@/components/page/page-layout";
import { isNotFoundAPIError } from "@/lib/api-errors";
import { getServerAPIClient } from "@/lib/server-api-client";

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
  const api = await getServerAPIClient();

  let datasetVariable;

  try {
    datasetVariable = (await api.datasetVariable.get({ id: variableId })) as DatasetVariable;
  } catch (error) {
    if (isNotFoundAPIError(error)) {
      return notFound();
    }

    throw error;
  }

  if (!datasetVariable) {
    return notFound();
  }

  // Ensure the variable belongs to the specified dataset
  if (datasetVariable.datasetId !== datasetId) {
    return notFound();
  }

  return (
    <PageLayout title={t("editVariable.title")} description={t("editVariable.description")}>
      <EditDatasetVariableForm datasetVariable={datasetVariable} />
    </PageLayout>
  );
}
