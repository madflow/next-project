"use client";

import { ChevronDown, ChevronRight, Edit, Folder, FolderOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DatasetVariableset, VariablesetTreeNode } from "@/types/dataset-variableset";
import { DeleteVariablesetDialog } from "./delete-variableset-dialog";

interface VariablesetTreeProps {
  nodes: VariablesetTreeNode[];
  datasetId: string;
  selectedSetId?: string | null;
  onSelectSet: (setId: string | null) => void;
  onEditSet: (variableset: DatasetVariableset) => void;
  onRefresh: () => void;
  onDeleteSet?: (deletedSetId: string) => void;
}

interface TreeNodeProps {
  node: VariablesetTreeNode;
  datasetId: string;
  selectedSetId?: string | null;
  onSelectSet: (setId: string | null) => void;
  onEditSet: (variableset: DatasetVariableset) => void;
  onRefresh: () => void;
  onDeleteSet?: (deletedSetId: string) => void;
}

function TreeNode({ node, datasetId, selectedSetId, onSelectSet, onEditSet, onRefresh, onDeleteSet }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedSetId === node.id;

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
    <div className="select-none">
      <div
        className={`group hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 ${
          isSelected ? "bg-accent" : ""
        }`}
        style={{ paddingLeft: `${node.level * 20 + 8}px` }}
        onClick={handleSelect}
        data-testid={`admin.dataset.variableset.tree.item.${node.id}`}>
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

      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              datasetId={datasetId}
              selectedSetId={selectedSetId}
              onSelectSet={onSelectSet}
              onEditSet={onEditSet}
              onRefresh={onRefresh}
              onDeleteSet={onDeleteSet}
            />
          ))}
        </div>
      )}
    </div>
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
      {nodes.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          datasetId={datasetId}
          selectedSetId={selectedSetId}
          onSelectSet={onSelectSet}
          onEditSet={onEditSet}
          onRefresh={onRefresh}
          onDeleteSet={onDeleteSet}
        />
      ))}
    </div>
  );
}
