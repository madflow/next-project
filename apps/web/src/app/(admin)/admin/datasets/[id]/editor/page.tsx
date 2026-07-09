import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { DatasetVariablesDataTable } from "@/components/admin/dataset-editor/data-table";
import { DatasetProjects } from "@/components/admin/dataset-editor/dataset-projects";
import { MetadataFilesTab } from "@/components/admin/dataset-editor/metadata-files-tab";
import { SplitVariablesTab } from "@/components/admin/dataset-editor/splitvariables-tab";
import { VariablesetTab } from "@/components/admin/dataset-editor/variableset-tab";
import { PageLayout } from "@/components/page/page-layout";
import { isNotFoundAPIError } from "@/lib/api-errors";
import { getServerAPIClient } from "@/lib/server-api-client";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const t = await getTranslations("adminDatasetEditor");
  const api = await getServerAPIClient();
  let dataset;

  try {
    dataset = await api.dataset.get({ embed: "organization", id });
  } catch (error) {
    if (isNotFoundAPIError(error)) {
      return notFound();
    }

    throw error;
  }

  if (!dataset) {
    return notFound();
  }

  const organization = dataset.organization;

  if (!organization) {
    return notFound();
  }

  return (
    <PageLayout title={t("editor.title", { name: dataset.name || "" })}>
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
          <TabsTrigger value="metadata" data-testid="app.admin.editor.metadata.tab">
            {t("editor.metadata")}
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
        <TabsContent value="metadata">
          <MetadataFilesTab datasetId={id} />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
