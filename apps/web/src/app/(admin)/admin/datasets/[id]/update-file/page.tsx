import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { UpdateDatasetFileForm } from "@/components/admin/dataset/update-dataset-file-form";
import { PageLayout } from "@/components/page/page-layout";
import { isNotFoundAPIError } from "@/lib/api-errors";
import { getServerAPIClient } from "@/lib/server-api-client";

type UpdateDatasetFilePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function UpdateDatasetFilePage({ params }: UpdateDatasetFilePageProps) {
  const { id } = await params;
  const api = await getServerAPIClient();
  const t = await getTranslations("adminDatasetUpdateFile");

  let dataset;
  try {
    dataset = await api.dataset.get({ id });
  } catch (error) {
    if (isNotFoundAPIError(error)) {
      notFound();
    }

    throw error;
  }

  if (!dataset) {
    notFound();
  }

  return (
    <PageLayout title={t("title", { name: dataset.name })} description={t("description")}>
      <UpdateDatasetFileForm dataset={dataset} />
    </PageLayout>
  );
}
