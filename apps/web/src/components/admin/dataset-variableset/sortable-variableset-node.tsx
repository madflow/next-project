"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronRight, Edit, Folder, FolderOpen, GripVertical } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DatasetVariableset, VariablesetTreeNode } from "@/types/dataset-variableset";
import { DeleteVariablesetDialog } from "./delete-variableset-dialog";

interface SortableVariablesetNodeProps {
  node: VariablesetTreeNode;
  datasetId: string;
  selectedSetId?: string | null;
  onSelectSet: (setId: string | null) => void;
  onEditSet: (variableset: DatasetVariableset) => void;
  onRefresh: () => void;
  onDeleteSet?: (deletedSetId: string) => void;
  children?: React.ReactNode;
}

export function SortableVariablesetNode({
  node,
  datasetId,
  selectedSetId,
  onSelectSet,
  onEditSet,
  onRefresh,
  onDeleteSet,
  children,
}: SortableVariablesetNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedSetId === node.id;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: node.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleToggle = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleSelect = () => {
    onSelectSet(node.id);
  };

  const handleEdit = () => {
    onEditSet({
      id: node.id,
      name: node.name,
      description: node.description || null,
      parentId: node.parentId || null,
      datasetId,
      orderIndex: 0,
      createdAt: new Date(),
      updatedAt: null,
      category: node.category,
    });
  };

  return (
    <div ref={setNodeRef} style={style} className="select-none">
      <div
        className={`group hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 ${
          isSelected ? "bg-accent" : ""
        }`}
        style={{ paddingLeft: `${node.level * 20 + 8}px` }}
        onClick={handleSelect}
        data-testid={`admin.dataset.variableset.tree.item.${node.id}`}>
        {/* Drag handle - only visible on hover */}
        <div
          {...attributes}
          {...listeners}
          className="text-muted-foreground flex h-4 w-4 cursor-grab items-center justify-center opacity-0 group-hover:opacity-100 active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}>
          <GripVertical className="h-3 w-3" />
        </div>

        <div
          className="flex h-4 w-4 items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            handleToggle();
          }}>
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="text-muted-foreground h-3 w-3" />
            ) : (
              <ChevronRight className="text-muted-foreground h-3 w-3" />
            )
          ) : (
            <div className="h-3 w-3" />
          )}
        </div>

        <div className="flex h-4 w-4 items-center justify-center">
          {hasChildren && isExpanded ? (
            <FolderOpen className="text-muted-foreground h-4 w-4" />
          ) : (
            <Folder className="text-muted-foreground h-4 w-4" />
          )}
        </div>

        <span
          className="flex-1 truncate text-sm font-medium"
          data-testid={`admin.dataset.variableset.tree.name.${node.id}`}>
          {node.name}
        </span>

        <Badge variant="secondary" className="text-xs">
          {node.variableCount}
        </Badge>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit();
            }}
            data-testid="admin.dataset.variableset.tree.edit">
            <Edit className="h-3 w-3" />
            <span className="sr-only">{"Edit"}</span>
          </Button>

          <DeleteVariablesetDialog
            variablesetId={node.id}
            variablesetName={node.name}
            onSuccess={() => {
              onRefresh();
              onDeleteSet?.(node.id);
            }}
          />
        </div>
      </div>

      {hasChildren && isExpanded && <div>{children}</div>}
    </div>
  );
}
