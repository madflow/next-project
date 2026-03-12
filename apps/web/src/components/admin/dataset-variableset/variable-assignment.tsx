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
import { FolderOpen, GripVertical, Plus, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type {
  DatasetVariableMeasure,
  DatasetVariableType,
  DatasetVariablesetItemAttributes,
} from "@repo/database/schema";
import {
  addVariableToVariableset,
  detachSubsetAction,
  removeContentFromVariablesetAction,
  reorderContentsAction,
} from "@/actions/dataset-variableset";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useQueryApi } from "@/hooks/use-query-api";
import { type VariablesetContentEntry, useVariablesetContents } from "@/hooks/use-variableset-contents";
import type { DatasetVariable } from "@/types/dataset-variable";
import { AllowedStatisticsSelector } from "./allowed-statistics-selector";

interface VariableAssignmentProps {
  datasetId: string;
  selectedSetId: string | null;
  onRefresh: () => void;
}

interface AvailableApiResponse {
  rows: DatasetVariable[];
  count: number;
  limit: number;
  offset: number;
}

// --- Sortable item: variable ---

interface SortableVariableItemProps {
  entry: VariablesetContentEntry;
  selectedSetId: string;
  onRemove: (contentId: string) => void;
  onRefresh: () => void;
  isRemoving: boolean;
}

function SortableVariableItem({ entry, selectedSetId, onRemove, onRefresh, isRemoving }: SortableVariableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: entry.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const variableAttributes = entry.attributes as DatasetVariablesetItemAttributes | null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="hover:bg-muted group flex items-start gap-2 rounded-md p-2"
      data-testid={`admin.dataset.variableset.assigned.variable.${entry.variableId}`}>
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
        onClick={() => onRemove(entry.id)}
        disabled={isRemoving}
        className="mt-0.5 h-6 w-6 shrink-0 p-0"
        data-testid="admin.dataset.variableset.assignment.remove">
        {isRemoving ? "..." : <X className="h-3 w-3" />}
      </Button>
      <div className="min-w-0 flex-1 overflow-hidden">
        {entry.variableLabel && <p className="mb-1 text-sm font-medium break-words">{entry.variableLabel}</p>}
        <p className="text-muted-foreground mb-1 truncate text-xs">{entry.variableName}</p>
        <div className="flex flex-wrap gap-1">
          {entry.variableMeasure && (
            <Badge variant="outline" className="shrink-0 text-xs">
              {entry.variableMeasure}
            </Badge>
          )}
          {entry.variableType && (
            <Badge variant="outline" className="shrink-0 text-xs">
              {entry.variableType}
            </Badge>
          )}
        </div>
        {variableAttributes && entry.variableId && entry.variableMeasure && entry.variableType && (
          <div className="mt-2">
            <AllowedStatisticsSelector
              variablesetId={selectedSetId}
              variableId={entry.variableId}
              variableMeasure={entry.variableMeasure as DatasetVariableMeasure}
              currentAttributes={variableAttributes}
              onUpdate={onRefresh}
              variableType={entry.variableType as DatasetVariableType}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// --- Sortable item: subset ---

interface SortableSubsetItemProps {
  entry: VariablesetContentEntry;
  onDetach: (subsetId: string) => void;
  isDetaching: boolean;
}

function SortableSubsetItem({ entry, onDetach, isDetaching }: SortableSubsetItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: entry.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="hover:bg-muted group flex items-center gap-2 rounded-md p-2"
      data-testid={`admin.dataset.variableset.assigned.subset.${entry.subsetId}`}>
      <div
        {...attributes}
        {...listeners}
        className="text-muted-foreground flex h-6 w-4 cursor-grab items-center justify-center opacity-0 group-hover:opacity-100 active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
        data-testid="admin.dataset.variableset.subset.drag-handle">
        <GripVertical className="h-3 w-3" />
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => entry.subsetId && onDetach(entry.subsetId)}
        disabled={isDetaching}
        className="h-6 w-6 shrink-0 p-0"
        data-testid="admin.dataset.variableset.assignment.detach-subset">
        {isDetaching ? "..." : <X className="h-3 w-3" />}
      </Button>
      <FolderOpen className="text-muted-foreground h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{entry.subsetName}</span>
    </div>
  );
}

// --- Main component ---

export function VariableAssignment({ datasetId, selectedSetId, onRefresh }: VariableAssignmentProps) {
  const t = useTranslations("adminDatasetVariableset");
  const [availableSearch, setAvailableSearch] = useState("");
  const [assignedSearch, setAssignedSearch] = useState("");
  const [isAssigning, setIsAssigning] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [isDetaching, setIsDetaching] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Fetch unassigned variables
  const {
    data: unassignedResponse,
    isLoading: isLoadingUnassigned,
    refetch: refetchUnassigned,
  } = useQueryApi<AvailableApiResponse>({
    endpoint: `/api/datasets/${datasetId}/variables/unassigned`,
    pagination: { pageIndex: 0, pageSize: 100 },
    sorting: [],
    search: availableSearch,
    queryKey: ["unassigned-variables", datasetId, availableSearch],
    enabled: !!selectedSetId,
  });

  // Fetch unified contents (variables + subsets interleaved by position)
  const {
    data: contents,
    isLoading: isLoadingContents,
    refetch: refetchContents,
  } = useVariablesetContents(selectedSetId);

  const [localContents, setLocalContents] = useState<VariablesetContentEntry[]>(contents ?? []);

  // Sync local state when contents change
  useEffect(() => {
    setLocalContents(contents ?? []);
  }, [contents]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragStart = (event: DragEndEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id || !selectedSetId) return;

    const oldIndex = localContents.findIndex((c) => c.id === active.id);
    const newIndex = localContents.findIndex((c) => c.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(localContents, oldIndex, newIndex);
    setLocalContents(reordered);

    try {
      await reorderContentsAction(
        selectedSetId,
        reordered.map((c) => c.id)
      );
      await refetchContents();
    } catch (error) {
      console.error("Failed to reorder contents:", error);
      toast.error(t("reorder.failed"));
      setLocalContents(contents ?? []);
    }
  };

  const handleAssignVariable = async (variableId: string) => {
    if (!selectedSetId) return;

    setIsAssigning(variableId);
    try {
      await addVariableToVariableset(selectedSetId, variableId);
      toast.success(t("assignment.addToSet"));
      refetchUnassigned();
      refetchContents();
      onRefresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to assign variable");
    } finally {
      setIsAssigning(null);
    }
  };

  const handleRemoveContent = async (contentId: string) => {
    setIsRemoving(contentId);
    try {
      if (!selectedSetId) return;
      await removeContentFromVariablesetAction(selectedSetId, contentId);
      toast.success(t("assignment.removeFromSet"));
      refetchUnassigned();
      refetchContents();
      onRefresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to remove item");
    } finally {
      setIsRemoving(null);
    }
  };

  const handleDetachSubset = async (subsetId: string) => {
    setIsDetaching(subsetId);
    try {
      await detachSubsetAction(subsetId);
      toast.success(t("assignment.detachSubset"));
      refetchContents();
      onRefresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to detach subset");
    } finally {
      setIsDetaching(null);
    }
  };

  // Filter contents by search term
  const filteredContents = assignedSearch
    ? localContents.filter((entry) => {
        const term = assignedSearch.toLowerCase();
        if (entry.contentType === "variable") {
          return entry.variableName?.toLowerCase().includes(term) || entry.variableLabel?.toLowerCase().includes(term);
        }
        return entry.subsetName?.toLowerCase().includes(term);
      })
    : localContents;

  // Find the active drag entry for the overlay label
  const activeDragEntry = activeId ? localContents.find((c) => c.id === activeId) : null;
  const activeDragLabel =
    activeDragEntry?.contentType === "variable"
      ? (activeDragEntry.variableLabel ?? activeDragEntry.variableName)
      : activeDragEntry?.subsetName;

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

      {/* Assigned Contents (variables + subsets interleaved) */}
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
            {isLoadingContents ? (
              <div className="text-muted-foreground p-4 text-center text-sm">{"Loading..."}</div>
            ) : filteredContents.length === 0 ? (
              <div className="text-muted-foreground p-4 text-center text-sm">{t("assignment.noAssigned")}</div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}>
                <SortableContext items={filteredContents.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1 p-2" data-testid="admin.dataset.variableset.assigned.variables.list">
                    {filteredContents.map((entry) =>
                      entry.contentType === "variable" ? (
                        <SortableVariableItem
                          key={entry.id}
                          entry={entry}
                          selectedSetId={selectedSetId}
                          onRemove={handleRemoveContent}
                          onRefresh={() => refetchContents()}
                          isRemoving={isRemoving === entry.id}
                        />
                      ) : (
                        <SortableSubsetItem
                          key={entry.id}
                          entry={entry}
                          onDetach={handleDetachSubset}
                          isDetaching={isDetaching === entry.subsetId}
                        />
                      )
                    )}
                  </div>
                </SortableContext>
                <DragOverlay>
                  {activeDragLabel ? (
                    <div className="bg-background rounded-md border p-2 opacity-80 shadow-lg">
                      <span className="text-sm">{activeDragLabel}</span>
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
