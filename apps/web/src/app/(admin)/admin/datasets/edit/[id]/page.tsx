import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { EditDatasetForm } from "@/components/admin/dataset/edit-dataset-form";
import { PageLayout } from "@/components/page/page-layout";
import { isNotFoundAPIError } from "@/lib/api-errors";
import { getServerAPIClient } from "@/lib/server-api-client";
import type { DatasetWithOrganizationJoin } from "@/types/dataset";

type EditDatasetPageProps = {
  params: Promise<{
    id: string;
  }>;
};
export default async function EditDatasetPage({ params }: EditDatasetPageProps) {
  const { id } = await params;
  const api = await getServerAPIClient();
  let dataset;

  try {
    dataset = await api.dataset.get({ embed: "organization", id });
  } catch (error) {
    if (isNotFoundAPIError(error)) {
      notFound();
    }

    throw error;
  }

  if (!dataset) {
    notFound();
  }

  const organization = dataset.organization;

  if (!organization) {
    notFound();
  }

  const t = await getTranslations("dataset");

  return (
    <PageLayout title={t("edit.title")} description={t("edit.description")} data-testid="admin.datasets.edit.page">
      <EditDatasetForm
        dataset={
          {
            datasets: dataset,
            organizations: organization,
          } as DatasetWithOrganizationJoin
        }
      />
    </PageLayout>
  );
}
