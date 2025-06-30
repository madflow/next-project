import { PageLayout } from "@/components/page/page-layout";
import { DatafileUploadForm } from "@/components/admin/datafile/upload-form";
import { getTranslations } from "next-intl/server";

export default async function UploadDataFilePage() {
  const t = await getTranslations("adminDatafile");
  
  return (
    <PageLayout 
      title={t("upload.title")} 
      description={t("upload.description")} 
      data-testid="admin.datafiles.upload.page"
    >
      <div className="py-6">
        <DatafileUploadForm />
      </div>
    </PageLayout>
  );
}
