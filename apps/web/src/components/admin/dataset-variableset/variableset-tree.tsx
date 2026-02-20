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
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Folder } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { DatasetVariableset, VariablesetTreeNode } from "@/types/dataset-variableset";
import { SortableVariablesetNode } from "./sortable-variableset-node";

interface VariablesetTreeProps {
  nodes: VariablesetTreeNode[];
  datasetId: string;
  selectedSetId?: string | null;
  onSelectSet: (setId: string | null) => void;
  onEditSet: (variableset: DatasetVariableset) => void;
  onRefresh: () => void;
  onDeleteSet?: (deletedSetId: string) => void;
  onReorder?: (parentId: string | null, reorderedIds: string[]) => Promise<void>;
}

interface TreeNodeProps {
  node: VariablesetTreeNode;
  datasetId: string;
  selectedSetId?: string | null;
  onSelectSet: (setId: string | null) => void;
  onEditSet: (variableset: DatasetVariableset) => void;
  onRefresh: () => void;
  onDeleteSet?: (deletedSetId: string) => void;
  onReorder?: (parentId: string | null, reorderedIds: string[]) => Promise<void>;
}

interface SortableListProps {
  nodes: VariablesetTreeNode[];
  parentId: string | null;
  datasetId: string;
  selectedSetId?: string | null;
  onSelectSet: (setId: string | null) => void;
  onEditSet: (variableset: DatasetVariableset) => void;
  onRefresh: () => void;
  onDeleteSet?: (deletedSetId: string) => void;
  onReorder?: (parentId: string | null, reorderedIds: string[]) => Promise<void>;
}

function SortableList({
  nodes,
  parentId,
  datasetId,
  selectedSetId,
  onSelectSet,
  onEditSet,
  onRefresh,
  onDeleteSet,
  onReorder,
}: SortableListProps) {
  const [localNodes, setLocalNodes] = useState(nodes);
  const [prevNodes, setPrevNodes] = useState(nodes);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Sync local nodes when the prop changes (getDerivedStateFromProps pattern)
  if (prevNodes !== nodes) {
    setPrevNodes(nodes);
    setLocalNodes(nodes);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required to start dragging
      },
    })
  );

  const handleDragStart = (event: DragEndEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = localNodes.findIndex((node) => node.id === active.id);
    const newIndex = localNodes.findIndex((node) => node.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Optimistically update local state
    const reorderedNodes = arrayMove(localNodes, oldIndex, newIndex);
    setLocalNodes(reorderedNodes);

    // Call the reorder callback
    if (onReorder) {
      try {
        const reorderedIds = reorderedNodes.map((node) => node.id);
        await onReorder(parentId, reorderedIds);
      } catch {
        // Revert on error
        setLocalNodes(nodes);
      }
    }
  };

  const activeNode = activeId ? localNodes.find((node) => node.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}>
      <SortableContext items={localNodes.map((node) => node.id)} strategy={verticalListSortingStrategy}>
        {localNodes.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            datasetId={datasetId}
            selectedSetId={selectedSetId}
            onSelectSet={onSelectSet}
            onEditSet={onEditSet}
            onRefresh={onRefresh}
            onDeleteSet={onDeleteSet}
            onReorder={onReorder}
          />
        ))}
      </SortableContext>
      <DragOverlay>
        {activeNode ? (
          <div className="bg-background rounded-md border px-2 py-1 opacity-80 shadow-lg">
            <span className="text-sm font-medium">{activeNode.name}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function TreeNode({
  node,
  datasetId,
  selectedSetId,
  onSelectSet,
  onEditSet,
  onRefresh,
  onDeleteSet,
  onReorder,
}: TreeNodeProps) {
  const hasChildren = node.children.length > 0;

  return (
    <SortableVariablesetNode
      node={node}
      datasetId={datasetId}
      selectedSetId={selectedSetId}
      onSelectSet={onSelectSet}
      onEditSet={onEditSet}
      onRefresh={onRefresh}
      onDeleteSet={onDeleteSet}>
      {hasChildren && (
        <SortableList
          nodes={node.children}
          parentId={node.id}
          datasetId={datasetId}
          selectedSetId={selectedSetId}
          onSelectSet={onSelectSet}
          onEditSet={onEditSet}
          onRefresh={onRefresh}
          onDeleteSet={onDeleteSet}
          onReorder={onReorder}
        />
      )}
    </SortableVariablesetNode>
  );
}

export function VariablesetTree({
  nodes,
  datasetId,
  selectedSetId,
  onSelectSet,
  onEditSet,
  onRefresh,
  onDeleteSet,
  onReorder,
}: VariablesetTreeProps) {
  const t = useTranslations("adminDatasetVariableset");

  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Folder className="text-muted-foreground mb-4 h-12 w-12" />
        <p className="text-muted-foreground mb-2 text-sm">{t("noSets")}</p>
        <p className="text-muted-foreground text-xs">{t("createFirstSet")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <SortableList
        nodes={nodes}
        parentId={null}
        datasetId={datasetId}
        selectedSetId={selectedSetId}
        onSelectSet={onSelectSet}
        onEditSet={onEditSet}
        onRefresh={onRefresh}
        onDeleteSet={onDeleteSet}
        onReorder={onReorder}
      />
    </div>
  );
}
