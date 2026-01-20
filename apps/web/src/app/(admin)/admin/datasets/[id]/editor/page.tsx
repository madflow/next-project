import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { DatasetVariablesDataTable } from "@/components/admin/dataset-editor/data-table";
import { DatasetProjects } from "@/components/admin/dataset-editor/dataset-projects";
import { SplitVariablesTab } from "@/components/admin/dataset-editor/splitvariables-tab";
import { VariablesetTab } from "@/components/admin/dataset-editor/variableset-tab";
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

  const organization = await findOrganization(dataset.datasets.organizationId);

  if (!organization) {
    return notFound();
  }

  return (
    <PageLayout title={t("editor.title", { name: dataset?.datasets.name || "" })}>
      <Tabs defaultValue="variables">
        <TabsList>
          <TabsTrigger value="variables" data-testid="app.admin.editor.variables.tab">
            {t("editor.variables")}
          </TabsTrigger>
          <TabsTrigger value="variablesets" data-testid="app.admin.editor.variablesets.tab">
            {t("editor.variablesets")}
          </TabsTrigger>
          <TabsTrigger value="splitvariables" data-testid="app.admin.editor.splitvariables.tab">
            {t("editor.splitvariables")}
          </TabsTrigger>
          <TabsTrigger value="projects" data-testid="app.admin.editor.projects.tab">
            {t("editor.projects")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="variables">
          <DatasetVariablesDataTable datasetId={id} />
        </TabsContent>
        <TabsContent value="variablesets">
          <VariablesetTab datasetId={id} />
        </TabsContent>
        <TabsContent value="splitvariables">
          <SplitVariablesTab datasetId={id} />
        </TabsContent>
        <TabsContent value="projects">
          <DatasetProjects datasetId={id} organizationId={organization.id} />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
