import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { columns } from "@/components/admin/datafile/columns";
import { DatafilesDataTable } from "@/components/admin/datafile/data-table";
import { PageLayout } from "@/components/page/page-layout";
import { Button } from "@/components/ui/button";

export default async function DatafilesPage() {
  const t = await getTranslations("adminDatafile");
  
  return (
    <PageLayout 
      title={t("title")} 
      description={t("description")} 
      data-testid="admin.datafiles.page"
    >
      <div className="space-y-4">
        <Button 
          asChild 
          data-testid="admin.datafiles.create.upload" 
          className="self-start"
        >
          <Link href="/admin/datafiles/upload">
            {t("uploadButton")}
          </Link>
        </Button>
        
        <DatafilesDataTable columns={columns} />
      </div>
    </PageLayout>
  );
}
