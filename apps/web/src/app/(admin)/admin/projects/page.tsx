import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { columns } from "@/components/admin/project/columns";
import { ProjectsDataTable } from "@/components/admin/project/data-table";
import { PageLayout } from "@/components/page/page-layout";
import { Button } from "@/components/ui/button";

export default async function Projects() {
  const t = await getTranslations("project");
  return (
    <PageLayout title={t("title")} description={t("description")} data-testid="admin.projects.page">
      <Button
        data-testid="admin.projects.create.button"
        className="self-start"
        nativeButton={false}
        render={<Link href="/admin/projects/new" />}>
        {t("createButton")}
      </Button>
      <ProjectsDataTable columns={columns} />
    </PageLayout>
  );
}
