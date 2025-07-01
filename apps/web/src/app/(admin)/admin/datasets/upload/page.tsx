import { getTranslations } from "next-intl/server";
import { DatasetUploadForm } from "@/components/admin/dataset/upload-form";
import { PageLayout } from "@/components/page/page-layout";

export default async function UploaddatasetPage() {
  const t = await getTranslations("adminDataset");

  return (
    <PageLayout
      title={t("upload.title")}
      description={t("upload.description")}
      data-testid="admin.datasets.upload.page">
      <div className="py-6">
        <DatasetUploadForm />
      </div>
    </PageLayout>
  );
}
