"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQueryApi } from "@/hooks/use-query-api";
import type { DatasetVariableset, VariablesetTreeNode } from "@/types/dataset-variableset";
import { VariableAssignment } from "../dataset-variableset/variable-assignment";
import { VariablesetForm } from "../dataset-variableset/variableset-form";
import { VariablesetTree } from "../dataset-variableset/variableset-tree";

interface VariablesetTabProps {
  datasetId: string;
}

interface HierarchyResponse {
  hierarchy: VariablesetTreeNode[];
}

export function VariablesetTab({ datasetId }: VariablesetTabProps) {
  const t = useTranslations("adminDatasetVariableset");
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVariableset, setEditingVariableset] = useState<DatasetVariableset | undefined>();

  const {
    data: hierarchyResponse,
    isLoading,
    refetch,
  } = useQueryApi<HierarchyResponse>({
    endpoint: `/api/datasets/${datasetId}/variablesets?hierarchical=true`,
    pagination: { pageIndex: 0, pageSize: 1000 },
    sorting: [],
    search: "",
    queryKey: ["variableset-hierarchy", datasetId],
  });

  const hierarchy = hierarchyResponse?.hierarchy || [];

  const handleCreateSet = () => {
    setEditingVariableset(undefined);
    setIsFormOpen(true);
  };

  const handleEditSet = (variableset: DatasetVariableset) => {
    setEditingVariableset(variableset);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    refetch();
  };

  const handleRefresh = () => {
    refetch();
  };

  // Flatten hierarchy for parent selection
  const flattenHierarchy = (nodes: VariablesetTreeNode[]): VariablesetTreeNode[] => {
    const result: VariablesetTreeNode[] = [];
    const visit = (node: VariablesetTreeNode) => {
      result.push(node);
      node.children.forEach(visit);
    };
    nodes.forEach(visit);
    return result;
  };

  const availableParents = flattenHierarchy(hierarchy);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-medium mt-6">{t("title")}</h2>
          <p className="text-muted-foreground text-sm">{t("description")}</p>
        </div>
        <Button onClick={handleCreateSet}>
          <Plus className="mr-2 h-4 w-4" />
          {t("createSet")}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Variable Sets Tree */}
        <Card className="h-fit rounded-md shadow-xs">
          <CardHeader>
            <CardTitle>{t("editTitle")}</CardTitle>
            <CardDescription>{t("editDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground text-sm">{"Loading..."}</div>
              </div>
            ) : (
              <VariablesetTree
                nodes={hierarchy}
                datasetId={datasetId}
                selectedSetId={selectedSetId}
                onSelectSet={setSelectedSetId}
                onEditSet={handleEditSet}
                onRefresh={handleRefresh}
              />
            )}
          </CardContent>
        </Card>

        {/* Variable Assignment */}
        <Card className="h-fit rounded-md shadow-xs">
          <CardHeader>
            <CardTitle>{t("assignVariables")}</CardTitle>
            <CardDescription>{t("assignment.description")}</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <VariableAssignment datasetId={datasetId} selectedSetId={selectedSetId} onRefresh={handleRefresh} />
          </CardContent>
        </Card>
      </div>

      <VariablesetForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        datasetId={datasetId}
        variableset={editingVariableset}
        availableParents={availableParents}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
