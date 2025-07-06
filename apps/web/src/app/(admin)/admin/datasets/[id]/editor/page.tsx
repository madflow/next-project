import { getTranslations } from "next-intl/server";
import { columns } from "@/components/admin/dataset-variable/columns";
import { DatasetVariablesDataTable } from "@/components/admin/dataset-variable/data-table";
import { PageLayout } from "@/components/page/page-layout";
import { find } from "@/dal/dataset";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const t = await getTranslations("adminDatasetVariable");
  const dataset = await find(id);

  return (
    <PageLayout title={t("editor.title", { name: dataset?.name || "" })}>
      <DatasetVariablesDataTable columns={columns} datasetId={id} />
    </PageLayout>
  );
}
