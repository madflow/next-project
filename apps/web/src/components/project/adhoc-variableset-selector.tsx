"use client";

import { ChevronDown, ChevronRight, PlayIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useDatasetVariablesets } from "@/hooks/use-dataset-variablesets";
import { useVariablesetVariables } from "@/hooks/use-variableset-variables";
import type { DatasetVariable } from "@/types/dataset-variable";
import type { VariablesetTreeNode } from "@/types/dataset-variableset";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Spinner } from "../ui/spinner";

export type SelectionItem = {
  type: "variable" | "set";
  variable?: DatasetVariable;
  variableset?: VariablesetTreeNode;
  variables?: DatasetVariable[];
  parentVariableset?: VariablesetTreeNode; // Add this for individual variable selections from a variableset
};

type AdHocVariablesetSelectorProps = {
  datasetId: string;
  onSelectionChangeAction: (selection: SelectionItem) => void;
};

type VariablesetNodeProps = {
  node: VariablesetTreeNode;
  level: number;
  onSelectSet: (node: VariablesetTreeNode) => void;
  onSelectVariable: (variable: DatasetVariable, parentVariableset?: VariablesetTreeNode) => void;
  expandedNodes: Set<string>;
  onToggleExpand: (nodeId: string) => void;
  search: string;
};

function VariablesetNode({
  node,
  level,
  onSelectSet,
  onSelectVariable,
  expandedNodes,
  onToggleExpand,
  search,
}: VariablesetNodeProps) {
  const isExpanded = expandedNodes.has(node.id);
  const { data: variablesData } = useVariablesetVariables(isExpanded ? node.id : null);
  const variables = variablesData?.rows || [];

  const filteredVariables = variables.filter(
    (variable) =>
      variable.name.toLowerCase().includes(search.toLowerCase()) ||
      variable.label?.toLowerCase().includes(search.toLowerCase())
  );

  const hasMatchingVariables = search ? filteredVariables.length > 0 : true;
  const nodeMatches = search
    ? node.name.toLowerCase().includes(search.toLowerCase()) ||
      node.description?.toLowerCase().includes(search.toLowerCase())
    : true;

  if (search && !nodeMatches && !hasMatchingVariables) {
    return null;
  }

  return (
    <div className="select-none">
      <div className="flex items-center gap-2 py-1" style={{ paddingLeft: `${level * 16}px` }}>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onToggleExpand(node.id)}>
          {node.children.length > 0 || node.variableCount > 0 ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            <div className="h-4 w-4" />
          )}
        </Button>

        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onSelectSet(node)}>
          <PlayIcon className="h-4 w-4" />
        </Button>

        <span className="flex-1 text-sm font-medium">{node.name}</span>

        <span className="text-muted-foreground text-xs">
          {"("}
          {node.variableCount}
          {")"}
        </span>
      </div>

      {isExpanded && (
        <div>
          {filteredVariables.map((variable) => (
            <div
              key={variable.id}
              className="flex items-center gap-2 py-1"
              style={{ paddingLeft: `${(level + 1) * 16 + 24}px` }}>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onSelectVariable(variable, node)}>
                <PlayIcon className="h-4 w-4" />
              </Button>

              <span className="text-sm">
                {variable.label} {"("}
                {variable.name}
                {")"}
              </span>
            </div>
          ))}

          {node.children.map((child) => (
            <VariablesetNode
              key={child.id}
              node={child}
              level={level + 1}
              onSelectSet={onSelectSet}
              onSelectVariable={(variable, childVariableset) => onSelectVariable(variable, childVariableset || node)}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
              search={search}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function AdHocVariablesetSelector({ datasetId, onSelectionChangeAction }: AdHocVariablesetSelectorProps) {
  const [search, setSearch] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const t = useTranslations("projectAdhocVariables");
  const { data: variablesets, isLoading } = useDatasetVariablesets(datasetId);

  const handleToggleExpand = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleSelectSet = async (node: VariablesetTreeNode) => {
    const response = await fetch(`/api/variablesets/${node.id}/variables`);
    if (response.ok) {
      const data = await response.json();
      onSelectionChangeAction({
        type: "set",
        variableset: node,
        variables: data.rows,
      });
    }
  };

  const handleSelectVariable = (variable: DatasetVariable, parentVariableset?: VariablesetTreeNode) => {
    onSelectionChangeAction({
      type: "variable",
      variable,
      parentVariableset,
    });
  };

  return (
    <Card className="shadow-xs">
      <CardHeader className="px-3">
        <Input type="text" placeholder={t("search")} onChange={(e) => setSearch(e.target.value)} value={search} />
      </CardHeader>
      <CardContent className="px-3">
        <ScrollArea className="flex max-h-[500px] min-h-[300px] flex-col gap-2">
          {isLoading && (
            <div className="text-muted-foreground text-sm">
              <Spinner />
            </div>
          )}
          {variablesets &&
            variablesets.map((node) => (
              <VariablesetNode
                key={node.id}
                node={node}
                level={0}
                onSelectSet={handleSelectSet}
                onSelectVariable={handleSelectVariable}
                expandedNodes={expandedNodes}
                onToggleExpand={handleToggleExpand}
                search={search}
              />
            ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

