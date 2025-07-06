import { DatasetVariablesDataTable } from "@/components/admin/dataset-variable/data-table";
import { columns } from "@/components/admin/dataset-variable/columns";
import { PageLayout } from "@/components/page/page-layout";
import { getTranslations } from "next-intl/server";
import { find } from "@/dal/dataset";

interface Props {
  params: {
    id: string;
  };
}

export default async function Page({ params }: Props) {
  const { id } = params;
  const t = await getTranslations("adminDatasetVariable");
  const dataset = await find(id);

  return (
    <PageLayout title={t("editor.title", { name: dataset?.name || "" })}>
      <DatasetVariablesDataTable columns={columns} datasetId={id} />
    </PageLayout>
  );
}
