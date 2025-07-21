import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { DatasetVariablesDataTable } from "@/components/admin/dataset-editor/data-table";
import { DatasetProjects } from "@/components/admin/dataset-editor/dataset-projects";
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
          <TabsTrigger value="variables" data-testid="app.admin.editor.variables.tab">
            {t("editor.variables")}
          </TabsTrigger>
          <TabsTrigger value="projects" data-testid="app.admin.editor.projects.tab">
            {t("editor.projects")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="variables">
          <DatasetVariablesDataTable datasetId={id} />
        </TabsContent>
        <TabsContent value="projects">
          <DatasetProjects datasetId={id} organizationId={organization.id} />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
