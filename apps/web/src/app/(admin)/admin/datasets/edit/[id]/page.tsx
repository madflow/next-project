import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { EditDatasetForm } from "@/components/admin/dataset/edit-dataset-form";
import { PageLayout } from "@/components/page/page-layout";
import { find } from "@/dal/dataset";
import type { DatasetWithOrganization } from "@/types/dataset";

type EditDatasetPageProps = {
  params: Promise<{
    id: string;
  }>;
};
export default async function EditDatasetPage({ params }: EditDatasetPageProps) {
  const { id } = await params;
  const dataset = (await find(id)) as DatasetWithOrganization | null;

  if (!dataset) {
    notFound();
  }

  const t = await getTranslations("dataset");

  return (
    <PageLayout title={t("edit.title")} description={t("edit.description")} data-testid="admin.datasets.edit.page">
      <EditDatasetForm dataset={dataset} />
    </PageLayout>
  );
}
