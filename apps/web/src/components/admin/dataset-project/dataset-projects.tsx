"use client";

import { useState } from "react";
import { toast } from "sonner";
import { addToProject } from "@/actions/dataset";
import { ProjectDropdown } from "@/components/dropdown/project-dropdown";
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

  const { data, isSuccess, isError } = useQueryApi<ApiResponsePayload<ResponseRow>>(
    `/api/datasets/${datasetId}/projects`,
    {
      limit: 100,
      offset: 0,
    }
  );

  const handleAddToProject = async () => {
    if (!selectedProject) {
      toast.error("Please select a project first.");
      return;
    }

    setIsAddingToProject(true);
    try {
      await addToProject(datasetId, selectedProject);
      toast.success("Dataset added to project successfully!");
    } catch (error) {
      console.error("Failed to add dataset to project:", error);
      toast.error("Failed to add dataset to project.");
    } finally {
      setIsAddingToProject(false);
    }
  };

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Failed to fetch projects.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Projects</CardTitle>
        <CardDescription>A dataset can be added to one or more projects.</CardDescription>
      </CardHeader>
      <CardContent>
        <ProjectDropdown onValueChange={setSelectedProject} organizationId={organizationId} />
        <Button className="mt-4" onClick={handleAddToProject} disabled={!selectedProject || isAddingToProject}>
          {isAddingToProject ? "Adding..." : "Add to project"}
        </Button>
        {isSuccess && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Name</TableHead>
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
  );
}
