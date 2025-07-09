import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { DatasetProjectsTable } from "@/components/admin/dataset-project/data-table";
import { columns } from "@/components/admin/dataset-variable/columns";
import { DatasetVariablesDataTable } from "@/components/admin/dataset-variable/data-table";
import { PageLayout } from "@/components/page/page-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { find } from "@/dal/dataset";
import { find as findOrganization } from "@/dal/organization";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const t = await getTranslations("adminDatasetEditor");
  const dataset = await find(id);

  if (!dataset) {
    return notFound();
  }

  const organization = await findOrganization(dataset.organizationId);

  if (!organization) {
    return notFound();
  }

  return (
    <PageLayout title={t("editor.title", { name: dataset?.name || "" })}>
      <Tabs defaultValue="variables">
        <TabsList>
          <TabsTrigger value="variables">{t("editor.variables")}</TabsTrigger>
          <TabsTrigger value="projects">{t("editor.projects")}</TabsTrigger>
        </TabsList>
        <TabsContent value="variables">
          <DatasetVariablesDataTable columns={columns} datasetId={id} />
        </TabsContent>
        <TabsContent value="projects">
          <DatasetProjectsTable datasetId={id} organizationId={organization.id} />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
