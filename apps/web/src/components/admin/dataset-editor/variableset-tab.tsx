"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { reorderVariablesetsAction } from "@/actions/dataset-variableset";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQueryApi } from "@/hooks/use-query-api";
import type { DatasetVariableset, VariablesetTreeNode } from "@/types/dataset-variableset";
import { ExportImportActions } from "../dataset-variableset/export-import-actions";
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
  const [assignmentKey, setAssignmentKey] = useState(0);

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

  const handleDeleteSet = (deletedSetId: string) => {
    // Clear selection if the deleted set was selected
    if (selectedSetId === deletedSetId) {
      setSelectedSetId(null);
    }
    // Force refresh assignments to reload unassigned variables
    setAssignmentKey((prev) => prev + 1);
  };

  const handleReorder = async (parentId: string | null, reorderedIds: string[]) => {
    try {
      await reorderVariablesetsAction(datasetId, parentId, reorderedIds);
      // Optionally refetch to ensure consistency
      await refetch();
    } catch (error) {
      console.error("Failed to reorder variablesets:", error);
      toast.error(t("reorder.failed"));
      throw error; // Re-throw to trigger optimistic update revert
    }
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
      <div>
        <h2 className="mt-6 text-base font-medium">{t("title")}</h2>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </div>

      <div className="w-full">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Variable Sets Tree */}
          <Card className="h-fit rounded-md shadow-xs lg:col-span-1">
            <CardHeader>
              <CardTitle>{t("editTitle")}</CardTitle>
              <CardDescription>{t("editDescription")}</CardDescription>
              <CardAction className="mt-2 flex items-center space-x-2">
                <Button
                  onClick={handleCreateSet}
                  data-testid="admin.dataset.variableset.create"
                  className="cursor-pointer">
                  {t("createSet")}
                </Button>
                <ExportImportActions datasetId={datasetId} onImportSuccess={handleRefresh} />
              </CardAction>
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
                  onDeleteSet={handleDeleteSet}
                  onReorder={handleReorder}
                />
              )}
            </CardContent>
          </Card>

          {/* Variable Assignment */}
          <Card className="h-fit rounded-md shadow-xs lg:col-span-2">
            <CardHeader>
              <CardTitle>{t("assignVariables")}</CardTitle>
              <CardDescription>{t("assignment.description")}</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <VariableAssignment
                key={assignmentKey}
                datasetId={datasetId}
                selectedSetId={selectedSetId}
                onRefresh={handleRefresh}
              />
            </CardContent>
          </Card>
        </div>
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
