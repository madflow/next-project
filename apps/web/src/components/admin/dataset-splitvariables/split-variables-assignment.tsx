"use client";

import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { addSplitVariableAction, removeSplitVariableAction } from "@/actions/dataset-splitvariable";
import { AdminVariableRow } from "@/components/admin/variable-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ItemGroup } from "@/components/ui/item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchInput } from "@/components/ui/search-input";
import { useQueryApi } from "@/hooks/use-query-api";
import type { DatasetVariable } from "@/types/dataset-variable";

interface SplitVariablesAssignmentProps {
  datasetId: string;
  onRefresh?: () => void;
}

interface ApiResponse {
  rows: DatasetVariable[];
  count: number;
  limit: number;
  offset: number;
}

export function SplitVariablesAssignment({ datasetId, onRefresh }: SplitVariablesAssignmentProps) {
  const t = useTranslations("adminDatasetSplitVariables");
  const [availableSearch, setAvailableSearch] = useState("");
  const [assignedSearch, setAssignedSearch] = useState("");
  const [isAssigning, setIsAssigning] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  // Fetch available variables (not yet split variables)
  const {
    data: availableResponse,
    isLoading: isLoadingAvailable,
    refetch: refetchAvailable,
  } = useQueryApi<ApiResponse>({
    endpoint: `/api/datasets/${datasetId}/variables/available-for-split`,
    pagination: { pageIndex: 0, pageSize: 100 },
    sorting: [],
    search: availableSearch,
    queryKey: ["available-split-variables", datasetId, availableSearch],
  });

  // Fetch assigned split variables
  const {
    data: assignedResponse,
    isLoading: isLoadingAssigned,
    refetch: refetchAssigned,
  } = useQueryApi<ApiResponse>({
    endpoint: `/api/datasets/${datasetId}/splitvariables`,
    pagination: { pageIndex: 0, pageSize: 100 },
    sorting: [],
    search: assignedSearch,
    queryKey: ["assigned-split-variables", datasetId, assignedSearch],
  });

  const handleAssignVariable = async (variableId: string) => {
    setIsAssigning(variableId);
    try {
      await addSplitVariableAction(datasetId, variableId);
      toast.success(t("assignment.addSuccess"));
      refetchAvailable();
      refetchAssigned();
      onRefresh?.();
    } catch (error) {
      console.error(error);
      toast.error(t("assignment.addError"));
    } finally {
      setIsAssigning(null);
    }
  };

  const handleRemoveVariable = async (variableId: string) => {
    setIsRemoving(variableId);
    try {
      await removeSplitVariableAction(datasetId, variableId);
      toast.success(t("assignment.removeSuccess"));
      refetchAvailable();
      refetchAssigned();
      onRefresh?.();
    } catch (error) {
      console.error(error);
      toast.error(t("assignment.removeError"));
    } finally {
      setIsRemoving(null);
    }
  };

  return (
    <div className="w-full">
      <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Available Variables */}
        <Card className="rounded-md shadow-xs lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle>{t("assignment.available")}</CardTitle>
            <SearchInput
              placeholder={t("assignment.search")}
              value={availableSearch}
              onChange={(e) => setAvailableSearch(e.target.value)}
              onClear={() => setAvailableSearch("")}
              aria-label={t("assignment.search")}
            />
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96" data-testid="admin.dataset.splitvariables.available.section">
              {isLoadingAvailable ? (
                <div className="text-muted-foreground p-4 text-center text-sm">{"Loading..."}</div>
              ) : availableResponse?.rows.length === 0 ? (
                <div
                  className="text-muted-foreground p-4 text-center text-sm"
                  data-testid="admin.dataset.splitvariables.available.empty">
                  {t("assignment.noAvailable")}
                </div>
              ) : (
                <ItemGroup className="gap-1 p-2" data-testid="admin.dataset.splitvariables.available.variables.list">
                  {availableResponse?.rows.map((variable) => (
                    <AdminVariableRow
                      key={variable.id}
                      actions={
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAssignVariable(variable.id)}
                          disabled={isAssigning === variable.id}
                          className="mt-0.5 h-6 w-6 shrink-0 p-0"
                          data-testid="admin.dataset.splitvariables.assignment.add">
                          {isAssigning === variable.id ? "..." : <Plus className="h-3 w-3" />}
                        </Button>
                      }
                      className="hover:bg-muted items-start gap-2 p-2"
                      label={variable.label}
                      measure={variable.measure}
                      variableName={variable.name}
                      variableType={variable.type}
                      data-testid={`admin.dataset.splitvariables.available.variable.${variable.id}`}>
                    </AdminVariableRow>
                  ))}
                </ItemGroup>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Assigned Split Variables */}
        <Card className="rounded-md shadow-xs lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle>{t("assignment.assigned")}</CardTitle>
            <SearchInput
              placeholder={t("assignment.search")}
              value={assignedSearch}
              onChange={(e) => setAssignedSearch(e.target.value)}
              onClear={() => setAssignedSearch("")}
              aria-label={t("assignment.search")}
            />
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96" data-testid="admin.dataset.splitvariables.assigned.section">
              {isLoadingAssigned ? (
                <div className="text-muted-foreground p-4 text-center text-sm">{"Loading..."}</div>
              ) : assignedResponse?.rows.length === 0 ? (
                <div
                  className="text-muted-foreground p-4 text-center text-sm"
                  data-testid="admin.dataset.splitvariables.assigned.empty">
                  {t("assignment.noAssigned")}
                </div>
              ) : (
                <ItemGroup className="gap-1 p-2" data-testid="admin.dataset.splitvariables.assigned.variables.list">
                  {assignedResponse?.rows.map((variable) => (
                    <AdminVariableRow
                      key={variable.id}
                      actions={
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveVariable(variable.id)}
                          disabled={isRemoving === variable.id}
                          className="mt-0.5 h-6 w-6 shrink-0 p-0"
                          data-testid="admin.dataset.splitvariables.assignment.remove">
                          {isRemoving === variable.id ? "..." : <X className="h-3 w-3" />}
                        </Button>
                      }
                      className="hover:bg-muted items-start gap-2 p-2"
                      label={variable.label}
                      measure={variable.measure}
                      variableName={variable.name}
                      variableType={variable.type}
                      data-testid={`admin.dataset.splitvariables.assigned.variable.${variable.id}`}>
                    </AdminVariableRow>
                  ))}
                </ItemGroup>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
