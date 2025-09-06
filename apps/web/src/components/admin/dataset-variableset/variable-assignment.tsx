"use client";

import { Search, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import {
  addVariableToVariableset,
  removeVariableFromVariableset,
} from "@/actions/dataset-variableset";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useQueryApi } from "@/hooks/use-query-api";
import type { DatasetVariable } from "@/types/dataset-variable";

interface VariableAssignmentProps {
  datasetId: string;
  selectedSetId: string | null;
  onRefresh: () => void;
}

interface ApiResponse {
  rows: DatasetVariable[];
  count: number;
  limit: number;
  offset: number;
}

export function VariableAssignment({
  datasetId,
  selectedSetId,
  onRefresh,
}: VariableAssignmentProps) {
  const t = useTranslations("adminDatasetVariableset");
  const [availableSearch, setAvailableSearch] = useState("");
  const [assignedSearch, setAssignedSearch] = useState("");
  const [isAssigning, setIsAssigning] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  // Fetch unassigned variables
  const {
    data: unassignedResponse,
    isLoading: isLoadingUnassigned,
    refetch: refetchUnassigned,
  } = useQueryApi<ApiResponse>({
    endpoint: `/api/datasets/${datasetId}/variablesets/dummy/variables?unassigned=true`,
    pagination: { pageIndex: 0, pageSize: 100 },
    sorting: [],
    search: availableSearch,
    queryKey: ["unassigned-variables", datasetId, availableSearch],
    enabled: !!selectedSetId,
  });

  // Fetch assigned variables
  const {
    data: assignedResponse,
    isLoading: isLoadingAssigned,
    refetch: refetchAssigned,
  } = useQueryApi<ApiResponse>({
    endpoint: selectedSetId
      ? `/api/datasets/${datasetId}/variablesets/${selectedSetId}/variables`
      : "",
    pagination: { pageIndex: 0, pageSize: 100 },
    sorting: [],
    search: assignedSearch,
    queryKey: ["assigned-variables", datasetId, selectedSetId, assignedSearch],
    enabled: !!selectedSetId,
  });

  const handleAssignVariable = async (variableId: string) => {
    if (!selectedSetId) return;

    setIsAssigning(variableId);
    try {
      await addVariableToVariableset(selectedSetId, variableId, datasetId);
      toast.success(t("assignment.addToSet"));
      refetchUnassigned();
      refetchAssigned();
      onRefresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to assign variable");
    } finally {
      setIsAssigning(null);
    }
  };

  const handleRemoveVariable = async (variableId: string) => {
    if (!selectedSetId) return;

    setIsRemoving(variableId);
    try {
      await removeVariableFromVariableset(selectedSetId, variableId, datasetId);
      toast.success(t("assignment.removeFromSet"));
      refetchUnassigned();
      refetchAssigned();
      onRefresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to remove variable");
    } finally {
      setIsRemoving(null);
    }
  };

  if (!selectedSetId) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">{t("assignment.selectSet")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
      {/* Available Variables */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("assignment.available")}</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
            {isLoadingUnassigned ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {"Loading..."}
              </div>
            ) : unassignedResponse?.rows.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {t("assignment.noVariables")}
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {unassignedResponse?.rows.map((variable) => (
                  <div
                    key={variable.id}
                    className="flex items-center justify-between rounded-md p-2 hover:bg-muted"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{variable.name}</p>
                      {variable.label && (
                        <p className="text-xs text-muted-foreground truncate">
                          {variable.label}
                        </p>
                      )}
                      <div className="flex gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {variable.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {variable.measure}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAssignVariable(variable.id)}
                      disabled={isAssigning === variable.id}
                      className="ml-2 shrink-0"
                    >
                      {isAssigning === variable.id ? (
                        "..."
                      ) : (
                        <Plus className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Assigned Variables */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("assignment.assigned")}</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
              <div className="p-4 text-center text-sm text-muted-foreground">
                {"Loading..."}
              </div>
            ) : assignedResponse?.rows.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {t("assignment.noAssigned")}
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {assignedResponse?.rows.map((variable) => (
                  <div
                    key={variable.id}
                    className="flex items-center justify-between rounded-md p-2 hover:bg-muted"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{variable.name}</p>
                      {variable.label && (
                        <p className="text-xs text-muted-foreground truncate">
                          {variable.label}
                        </p>
                      )}
                      <div className="flex gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {variable.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {variable.measure}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveVariable(variable.id)}
                      disabled={isRemoving === variable.id}
                      className="ml-2 shrink-0"
                    >
                      {isRemoving === variable.id ? (
                        "..."
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                    </Button>
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