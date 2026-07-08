import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { columns } from "@/components/admin/dataset/columns";
import { DatasetsDataTable } from "@/components/admin/dataset/data-table";
import { PageLayout } from "@/components/page/page-layout";
import { Button } from "@/components/ui/button";

export default async function DatasetsPage() {
  const t = await getTranslations("adminDataset");

  return (
    <PageLayout title={t("title")} description={t("description")} data-testid="admin.datasets.page">
      <div className="space-y-4">
        <Button
          data-testid="admin.datasets.create.upload"
          className="self-start"
          nativeButton={false}
          render={<Link href="/admin/datasets/upload" />}>
          {t("uploadButton")}
        </Button>

        <DatasetsDataTable columns={columns} />
      </div>
    </PageLayout>
  );
}
