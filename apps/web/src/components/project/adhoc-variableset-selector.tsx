"use client";

import { ChevronDown, ChevronRight, Palette } from "lucide-react";
import { useTranslations } from "next-intl";
import { Select as SelectPrimitive } from "radix-ui";
import { useState } from "react";
import { useThemeConfig } from "@/components/active-theme";
import { useOrganizationTheme } from "@/context/organization-theme-context";
import { useDatasetVariablesets } from "@/hooks/use-dataset-variablesets";
import { useVariablesetContents } from "@/hooks/use-variableset-contents";
import { useVariablesetVariables } from "@/hooks/use-variableset-variables";
import { getVariableLabel } from "@/lib/variable-helpers";
import type { DatasetVariableWithAttributes } from "@/types/dataset-variable";
import type { VariablesetTreeNode } from "@/types/dataset-variableset";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { SearchInput } from "../ui/search-input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator } from "../ui/select";
import { Spinner } from "../ui/spinner";

export type SelectionItem = {
  type: "variable" | "set";
  variable?: DatasetVariableWithAttributes;
  variableset?: VariablesetTreeNode;
  variables?: DatasetVariableWithAttributes[];
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
  onSelectVariable: (variable: DatasetVariableWithAttributes, parentVariableset?: VariablesetTreeNode) => void;
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
  const shouldFetch = isExpanded || !!search;
  const { data: contentsData } = useVariablesetContents(shouldFetch ? node.id : null);
  // Keep useVariablesetVariables for when the user selects an entire set
  const { data: variablesData } = useVariablesetVariables(shouldFetch ? node.id : null);
  const contents = contentsData || [];

  // Build a map of child nodes by ID for subset rendering
  const childNodeMap = new Map<string, VariablesetTreeNode>();
  for (const child of node.children) {
    childNodeMap.set(child.id, child);
  }

  // Filter contents based on search
  const filteredContents = contents.filter((entry) => {
    if (!search) return true;
    const lowerSearch = search.toLowerCase();
    if (entry.contentType === "variable") {
      return (
        entry.variableName?.toLowerCase().includes(lowerSearch) ||
        entry.variableLabel?.toLowerCase().includes(lowerSearch)
      );
    }
    if (entry.contentType === "subset") {
      const childNode = entry.subsetId ? childNodeMap.get(entry.subsetId) : null;
      return (
        entry.subsetName?.toLowerCase().includes(lowerSearch) ||
        entry.subsetDescription?.toLowerCase().includes(lowerSearch) ||
        // Also show subset if any of its children match (recursive match handled by child rendering)
        (childNode && childNode.name.toLowerCase().includes(lowerSearch))
      );
    }
    return true;
  });

  const hasMatchingContent = search ? filteredContents.length > 0 : true;
  const nodeMatches = search
    ? node.name.toLowerCase().includes(search.toLowerCase()) ||
      node.description?.toLowerCase().includes(search.toLowerCase())
    : true;

  if (search && !nodeMatches && !hasMatchingContent) {
    return null;
  }

  return (
    <div className="select-none">
      <div className="flex items-center gap-2 py-1" style={{ paddingLeft: `${level * 16}px` }}>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => onToggleExpand(node.id)}
          data-testid={`variable-group-expand-${node.name}`}>
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

        <button
          className="hover:bg-accent hover:text-accent-foreground flex-1 cursor-pointer rounded px-1 py-0.5 text-left text-sm font-medium transition-colors"
          onClick={() => onSelectSet(node)}
          data-testid={`variable-group-${node.name}`}>
          {node.name}
        </button>

        <span className="text-muted-foreground text-xs">
          {"("}
          {node.variableCount}
          {")"}
        </span>
      </div>

      {isExpanded && (
        <div>
          {filteredContents.map((entry) => {
            if (entry.contentType === "variable" && entry.variableId) {
              // Render variable item inline
              const variable = variablesData?.rows.find((v) => v.id === entry.variableId);
              const displayLabel = entry.variableLabel || entry.variableName || entry.variableId;
              const testId = entry.variableName
                ? `variable-item-${entry.variableName.replace(/[^a-zA-Z0-9-_]/g, "-")}`
                : `variable-item-${entry.variableId}`;

              return (
                <div
                  key={entry.id}
                  className="flex items-center py-1"
                  style={{ paddingLeft: `${(level + 1) * 16 + 24}px` }}>
                  <button
                    className="hover:bg-accent hover:text-accent-foreground flex-1 cursor-pointer rounded px-1 py-0.5 text-left text-sm transition-colors"
                    onClick={() => {
                      if (variable) {
                        onSelectVariable(variable, node);
                      }
                    }}
                    data-testid={testId}>
                    {variable ? getVariableLabel(variable) : displayLabel}
                  </button>
                </div>
              );
            }

            if (entry.contentType === "subset" && entry.subsetId) {
              // Render child variableset node recursively
              const childNode = childNodeMap.get(entry.subsetId);
              if (!childNode) return null;

              return (
                <VariablesetNode
                  key={entry.id}
                  node={childNode}
                  level={level + 1}
                  onSelectSet={onSelectSet}
                  onSelectVariable={(variable, childVariableset) =>
                    onSelectVariable(variable, childVariableset || node)
                  }
                  expandedNodes={expandedNodes}
                  onToggleExpand={onToggleExpand}
                  search={search}
                />
              );
            }

            return null;
          })}

          {/* Render any child nodes that aren't in the contents table yet (fallback) */}
          {node.children
            .filter((child) => !contents.some((c) => c.contentType === "subset" && c.subsetId === child.id))
            .map((child) => (
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
  const tTheme = useTranslations("themeSelector");
  const { data: variablesets, isLoading } = useDatasetVariablesets(datasetId);
  const { activeTheme, setActiveTheme } = useThemeConfig();
  const { availableThemes } = useOrganizationTheme();

  // Theme constants
  const DEFAULT_THEMES = [
    { name: "Default", value: "default" },
    { name: "Scaled", value: "scaled" },
    { name: "Mono", value: "mono" },
  ];

  const COLOR_THEMES = [
    { name: "Blue", value: "blue", exampleClassName: "bg-blue-500" },
    { name: "Green", value: "green", exampleClassName: "bg-green-500" },
    { name: "Amber", value: "amber", exampleClassName: "bg-amber-500" },
    { name: "Rose", value: "rose", exampleClassName: "bg-rose-500" },
    { name: "Purple", value: "purple", exampleClassName: "bg-purple-500" },
    { name: "Orange", value: "orange", exampleClassName: "bg-orange-500" },
    { name: "Teal", value: "teal", exampleClassName: "bg-teal-500" },
  ];

  // Get organization-specific themes
  const organizationThemes = availableThemes.filter((theme) => {
    const isDefaultTheme = DEFAULT_THEMES.some(
      (defaultTheme) => defaultTheme.name.toLowerCase() === theme.name.toLowerCase()
    );
    return !isDefaultTheme;
  });

  // Helper function to get display colors for org themes
  const getThemeColors = (theme: (typeof organizationThemes)[0]) => {
    if (!theme.chartColors) return null;
    const colors = Object.values(theme.chartColors).slice(0, 3);
    return colors.length > 0 ? colors : null;
  };

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

  const handleSelectVariable = (variable: DatasetVariableWithAttributes, parentVariableset?: VariablesetTreeNode) => {
    onSelectionChangeAction({
      type: "variable",
      variable,
      parentVariableset,
    });
  };

  return (
    <Card className="shadow-xs">
      <CardHeader className="px-3">
        <SearchInput
          placeholder={t("search")}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
          value={search}
          aria-label={t("search")}
        />
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
      <CardFooter className="flex justify-end px-2">
        <Select value={activeTheme} onValueChange={setActiveTheme}>
          <SelectPrimitive.Trigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title={tTheme("changeTheme")}>
              <Palette className="h-4 w-4" />
            </Button>
          </SelectPrimitive.Trigger>
          <SelectContent align="end" position="popper" side="top">
            <SelectGroup>
              {DEFAULT_THEMES.map((theme) => (
                <SelectItem key={theme.name} value={theme.value} className="data-[state=checked]:opacity-50">
                  {theme.name}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>{"Colors"}</SelectLabel>
              {COLOR_THEMES.map((theme) => (
                <SelectItem key={theme.name} value={theme.value} className="data-[state=checked]:opacity-50">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${theme.exampleClassName}`} />
                    {theme.name}
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
            {organizationThemes.length > 0 && (
              <>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel>{"Organization"}</SelectLabel>
                  {organizationThemes.map((theme) => {
                    const colors = getThemeColors(theme);
                    return (
                      <SelectItem
                        key={theme.name}
                        value={theme.name.toLowerCase()}
                        className="data-[state=checked]:opacity-50">
                        <div className="flex items-center gap-2">
                          {colors && (
                            <div className="flex gap-1">
                              {colors.map((color, index) => (
                                <div
                                  key={index}
                                  className="h-3 w-3 rounded-full border border-gray-200"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          )}
                          {theme.name}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              </>
            )}
          </SelectContent>
        </Select>
      </CardFooter>
    </Card>
  );
}
