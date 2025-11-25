"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { addToProject } from "@/actions/dataset";
import { ProjectSelect } from "@/components/form/project-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiResponsePayload, useQueryApi } from "@/hooks/use-api";
import { Project } from "@/types/project";

type DatasetProjectsProps = {
  datasetId: string;
  organizationId: string;
};

type ResponseRow = {
  projects: Project;
};

export function DatasetProjects({ datasetId, organizationId }: DatasetProjectsProps) {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isAddingToProject, setIsAddingToProject] = useState(false);
  const t = useTranslations("adminDatasetEditor");

  const { data, isSuccess, isError, refetch } = useQueryApi<ApiResponsePayload<ResponseRow>>(
    `/api/datasets/${datasetId}/projects`,
    {
      limit: 100,
      offset: 0,
    }
  );

  const handleAddToProject = async () => {
    if (!selectedProject) {
      toast.error(t("selectProjectError"));
      return;
    }

    setIsAddingToProject(true);
    try {
      await addToProject(datasetId, selectedProject);
      refetch();
      toast.success(t("addToProjectSuccess"));
    } catch (error) {
      console.error(t("addToProjectError"), error);
      toast.error(t("addToProjectError"));
    } finally {
      setIsAddingToProject(false);
    }
  };

  if (isError) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="mt-6 text-base font-medium">{t("projects")}</h2>
          <p className="text-muted-foreground text-sm">{t("datasetProjectsDescription")}</p>
        </div>

        <Card className="rounded-md shadow-xs">
          <CardHeader>
            <CardTitle>{t("error")}</CardTitle>
            <CardDescription>{t("fetchProjectsError")}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="mt-6 text-base font-medium">{t("projects")}</h2>
        <p className="text-muted-foreground text-sm">{t("datasetProjectsDescription")}</p>
      </div>

      <Card className="rounded-md shadow-xs">
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <ProjectSelect onValueChange={setSelectedProject} organizationId={organizationId} />
            <Button onClick={handleAddToProject} disabled={!selectedProject || isAddingToProject}>
              {isAddingToProject ? t("adding") : t("addToProject")}
            </Button>
          </div>
          {isSuccess && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">{t("name")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((item) => (
                  <TableRow key={item.projects.id}>
                    <TableCell className="font-medium">{item.projects.name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
