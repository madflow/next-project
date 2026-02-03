"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { DatasetVariablesetItemAttributes } from "@repo/database/schema";
import {
  addVariableToVariableset,
  removeVariableFromVariableset,
  reorderVariablesetItemsAction,
} from "@/actions/dataset-variableset";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useQueryApi } from "@/hooks/use-query-api";
import type { DatasetVariable } from "@/types/dataset-variable";
import { AllowedStatisticsSelector } from "./allowed-statistics-selector";

interface VariableAssignmentProps {
  datasetId: string;
  selectedSetId: string | null;
  onRefresh: () => void;
}

interface ApiResponse {
  rows: (DatasetVariable & { attributes?: DatasetVariablesetItemAttributes })[];
  count: number;
  limit: number;
  offset: number;
}

interface SortableVariableItemProps {
  variable: DatasetVariable & { attributes?: DatasetVariablesetItemAttributes };
  selectedSetId: string;
  onRemove: (variableId: string) => void;
  onRefresh: () => void;
  isRemoving: boolean;
}

function SortableVariableItem({ variable, selectedSetId, onRemove, onRefresh, isRemoving }: SortableVariableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: variable.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="hover:bg-muted group flex items-start gap-2 rounded-md p-2"
      data-testid={`admin.dataset.variableset.assigned.variable.${variable.id}`}>
      {/* Drag handle - only visible on hover */}
      <div
        {...attributes}
        {...listeners}
        className="text-muted-foreground mt-0.5 flex h-6 w-4 cursor-grab items-center justify-center opacity-0 group-hover:opacity-100 active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
        data-testid="admin.dataset.variableset.variable.drag-handle">
        <GripVertical className="h-3 w-3" />
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onRemove(variable.id)}
        disabled={isRemoving}
        className="mt-0.5 h-6 w-6 shrink-0 p-0"
        data-testid="admin.dataset.variableset.assignment.remove">
        {isRemoving ? "..." : <X className="h-3 w-3" />}
      </Button>
      <div className="min-w-0 flex-1 overflow-hidden">
        {variable.label && <p className="mb-1 text-sm font-medium break-words">{variable.label}</p>}
        <p className="text-muted-foreground mb-1 truncate text-xs">{variable.name}</p>
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="shrink-0 text-xs">
            {variable.measure}
          </Badge>
          <Badge variant="outline" className="shrink-0 text-xs">
            {variable.type}
          </Badge>
        </div>
        {variable.attributes && (
          <div className="mt-2">
            <AllowedStatisticsSelector
              variablesetId={selectedSetId}
              variableId={variable.id}
              variableMeasure={variable.measure}
              currentAttributes={variable.attributes}
              onUpdate={onRefresh}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function VariableAssignment({ datasetId, selectedSetId, onRefresh }: VariableAssignmentProps) {
  const t = useTranslations("adminDatasetVariableset");
  const [availableSearch, setAvailableSearch] = useState("");
  const [assignedSearch, setAssignedSearch] = useState("");
  const [isAssigning, setIsAssigning] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Fetch unassigned variables
  const {
    data: unassignedResponse,
    isLoading: isLoadingUnassigned,
    refetch: refetchUnassigned,
  } = useQueryApi<ApiResponse>({
    endpoint: `/api/datasets/${datasetId}/variables/unassigned`,
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
    endpoint: selectedSetId ? `/api/datasets/${datasetId}/variablesets/${selectedSetId}/variables` : "",
    pagination: { pageIndex: 0, pageSize: 100 },
    sorting: [],
    search: assignedSearch,
    queryKey: ["assigned-variables", datasetId, selectedSetId, assignedSearch],
    enabled: !!selectedSetId,
  });

  const [localAssignedVariables, setLocalAssignedVariables] = useState(assignedResponse?.rows || []);

  // Update local state when data changes
  useEffect(() => {
    if (assignedResponse?.rows) {
      setLocalAssignedVariables(assignedResponse.rows);
    }
  }, [assignedResponse?.rows]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = (event: DragEndEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id || !selectedSetId) {
      return;
    }

    const oldIndex = localAssignedVariables.findIndex((v) => v.id === active.id);
    const newIndex = localAssignedVariables.findIndex((v) => v.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Optimistically update local state
    const reorderedVariables = arrayMove(localAssignedVariables, oldIndex, newIndex);
    setLocalAssignedVariables(reorderedVariables);

    // Call the reorder action
    try {
      const reorderedIds = reorderedVariables.map((v) => v.id);
      await reorderVariablesetItemsAction(selectedSetId, reorderedIds);
      await refetchAssigned();
    } catch (error) {
      console.error("Failed to reorder variables:", error);
      toast.error(t("reorder.failed"));
      // Revert on error
      setLocalAssignedVariables(assignedResponse?.rows || []);
    }
  };

  const handleAssignVariable = async (variableId: string) => {
    if (!selectedSetId) return;

    setIsAssigning(variableId);
    try {
      await addVariableToVariableset(selectedSetId, variableId);
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
      await removeVariableFromVariableset(selectedSetId, variableId);
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
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Search className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <p className="text-muted-foreground text-sm">{t("assignment.selectSet")}</p>
        </div>
      </div>
    );
  }

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
            {isLoadingUnassigned ? (
              <div className="text-muted-foreground p-4 text-center text-sm">{"Loading..."}</div>
            ) : unassignedResponse?.rows.length === 0 ? (
              <div className="text-muted-foreground p-4 text-center text-sm">{t("assignment.noVariables")}</div>
            ) : (
              <div className="space-y-1 p-2" data-testid="admin.dataset.variableset.available.variables.list">
                {unassignedResponse?.rows.map((variable) => (
                  <div
                    key={variable.id}
                    className="hover:bg-muted flex items-start gap-2 rounded-md p-2"
                    data-testid={`admin.dataset.variableset.available.variable.${variable.id}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAssignVariable(variable.id)}
                      disabled={isAssigning === variable.id}
                      className="mt-0.5 h-6 w-6 shrink-0 p-0"
                      data-testid="admin.dataset.variableset.assignment.add">
                      {isAssigning === variable.id ? "..." : <Plus className="h-3 w-3" />}
                    </Button>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      {variable.label && <p className="mb-1 text-sm font-medium break-words">{variable.label}</p>}
                      <p className="text-muted-foreground mb-1 truncate text-xs">{variable.name}</p>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {variable.measure}
                        </Badge>
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {variable.type}
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

      {/* Assigned Variables */}
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
            ) : localAssignedVariables.length === 0 ? (
              <div className="text-muted-foreground p-4 text-center text-sm">{t("assignment.noAssigned")}</div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}>
                <SortableContext items={localAssignedVariables.map((v) => v.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1 p-2" data-testid="admin.dataset.variableset.assigned.variables.list">
                    {localAssignedVariables.map((variable) => (
                      <SortableVariableItem
                        key={variable.id}
                        variable={variable}
                        selectedSetId={selectedSetId!}
                        onRemove={handleRemoveVariable}
                        onRefresh={refetchAssigned}
                        isRemoving={isRemoving === variable.id}
                      />
                    ))}
                  </div>
                </SortableContext>
                <DragOverlay>
                  {activeId ? (
                    <div className="bg-background rounded-md border p-2 opacity-80 shadow-lg">
                      <span className="text-sm">
                        {localAssignedVariables.find((v) => v.id === activeId)?.label ||
                          localAssignedVariables.find((v) => v.id === activeId)?.name}
                      </span>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
