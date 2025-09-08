"use client";

import { Plus, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { addSplitVariableAction, removeSplitVariableAction } from "@/actions/dataset-splitvariable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
    <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Available Variables */}
      <Card className="rounded-md shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle>{t("assignment.available")}</CardTitle>
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder={t("assignment.search")}
              value={availableSearch}
              onChange={(e) => setAvailableSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <ScrollArea className="h-96">
            {isLoadingAvailable ? (
              <div className="text-muted-foreground p-4 text-center text-sm">{"Loading..."}</div>
            ) : availableResponse?.rows.length === 0 ? (
              <div className="text-muted-foreground p-4 text-center text-sm">{t("assignment.noAvailable")}</div>
            ) : (
              <div className="space-y-1 p-2" data-testid="admin.dataset.splitvariables.available.variables.list">
                 {availableResponse?.rows.map((variable) => (
                   <div key={variable.id} className="hover:bg-muted flex items-start gap-2 rounded-md p-2" data-testid={`admin.dataset.splitvariables.available.variable.${variable.id}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAssignVariable(variable.id)}
                      disabled={isAssigning === variable.id}
                      className="mt-0.5 h-6 w-6 shrink-0 p-0"
                      data-testid="admin.dataset.splitvariables.assignment.add">
                      {isAssigning === variable.id ? "..." : <Plus className="h-3 w-3" />}
                    </Button>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p className="mb-1 truncate text-sm font-medium">{variable.name}</p>
                      {variable.label && (
                        <p className="text-muted-foreground mb-1 truncate text-xs">{variable.label}</p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {variable.type}
                        </Badge>
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {variable.measure}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Assigned Split Variables */}
      <Card className="rounded-md shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle>{t("assignment.assigned")}</CardTitle>
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder={t("assignment.search")}
              value={assignedSearch}
              onChange={(e) => setAssignedSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <ScrollArea className="h-96">
            {isLoadingAssigned ? (
              <div className="text-muted-foreground p-4 text-center text-sm">{"Loading..."}</div>
            ) : assignedResponse?.rows.length === 0 ? (
              <div className="text-muted-foreground p-4 text-center text-sm">{t("assignment.noAssigned")}</div>
             ) : (
               <div className="space-y-1 p-2" data-testid="admin.dataset.splitvariables.assigned.variables.list">
                  {assignedResponse?.rows.map((variable) => (
                   <div key={variable.id} className="hover:bg-muted flex items-start gap-2 rounded-md p-2" data-testid={`admin.dataset.splitvariables.assigned.variable.${variable.id}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveVariable(variable.id)}
                      disabled={isRemoving === variable.id}
                      className="mt-0.5 h-6 w-6 shrink-0 p-0"
                      data-testid="admin.dataset.splitvariables.assignment.remove">
                      {isRemoving === variable.id ? "..." : <X className="h-3 w-3" />}
                    </Button>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p className="mb-1 truncate text-sm font-medium">{variable.name}</p>
                      {variable.label && (
                        <p className="text-muted-foreground mb-1 truncate text-xs">{variable.label}</p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {variable.type}
                        </Badge>
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {variable.measure}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}