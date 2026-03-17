import type { SelectionItem } from "@/components/project/adhoc-variableset-selector";
import type { VariablesetTreeNode } from "@/types/dataset-variableset";

const DATASET_PARAM = "dataset";
const SELECTION_TYPE_PARAM = "selectionType";
const VARIABLE_PARAM = "variable";
const SET_PARAM = "set";
const PARENT_SET_PARAM = "parentSet";

type ParsedVariableSelection = {
  type: "variable";
  variableName: string;
  parentVariablesetId: string | null;
};

type ParsedSetSelection = {
  type: "set";
  variablesetId: string;
};

export type ParsedAdhocUrlSelection = ParsedVariableSelection | ParsedSetSelection;

export type ParsedAdhocUrlState = {
  selectedDataset: string | null;
  selection: ParsedAdhocUrlSelection | null;
  hasKnownState: boolean;
  hasSelectionParams: boolean;
};

function getTrimmedParam(searchParams: URLSearchParams, key: string) {
  const value = searchParams.get(key)?.trim();
  return value ? value : null;
}

export function parseAdhocUrlState(searchParams: URLSearchParams): ParsedAdhocUrlState {
  const selectedDataset = getTrimmedParam(searchParams, DATASET_PARAM);
  const selectionType = getTrimmedParam(searchParams, SELECTION_TYPE_PARAM);
  const variableName = getTrimmedParam(searchParams, VARIABLE_PARAM);
  const variablesetId = getTrimmedParam(searchParams, SET_PARAM);
  const parentVariablesetId = getTrimmedParam(searchParams, PARENT_SET_PARAM);

  let selection: ParsedAdhocUrlSelection | null = null;

  if (selectedDataset && selectionType === "variable" && variableName) {
    selection = {
      type: "variable",
      variableName,
      parentVariablesetId,
    };
  }

  if (selectedDataset && selectionType === "set" && variablesetId) {
    selection = {
      type: "set",
      variablesetId,
    };
  }

  const hasSelectionParams = Boolean(selectionType || variableName || variablesetId || parentVariablesetId);

  return {
    selectedDataset,
    selection,
    hasKnownState: Boolean(selectedDataset || hasSelectionParams),
    hasSelectionParams,
  };
}

export function buildAdhocUrlSearchParams(
  searchParams: URLSearchParams,
  state: {
    selectedDataset: string | null;
    selection: SelectionItem | null;
  }
) {
  const nextSearchParams = new URLSearchParams(searchParams.toString());

  if (!state.selectedDataset) {
    nextSearchParams.delete(DATASET_PARAM);
    nextSearchParams.delete(SELECTION_TYPE_PARAM);
    nextSearchParams.delete(VARIABLE_PARAM);
    nextSearchParams.delete(SET_PARAM);
    nextSearchParams.delete(PARENT_SET_PARAM);
    return nextSearchParams;
  }

  nextSearchParams.set(DATASET_PARAM, state.selectedDataset);

  if (!state.selection) {
    nextSearchParams.delete(SELECTION_TYPE_PARAM);
    nextSearchParams.delete(VARIABLE_PARAM);
    nextSearchParams.delete(SET_PARAM);
    nextSearchParams.delete(PARENT_SET_PARAM);
    return nextSearchParams;
  }

  if (state.selection.type === "variable" && state.selection.variable) {
    nextSearchParams.set(SELECTION_TYPE_PARAM, "variable");
    nextSearchParams.set(VARIABLE_PARAM, state.selection.variable.name);
    nextSearchParams.delete(SET_PARAM);

    if (state.selection.parentVariableset?.id) {
      nextSearchParams.set(PARENT_SET_PARAM, state.selection.parentVariableset.id);
    } else {
      nextSearchParams.delete(PARENT_SET_PARAM);
    }

    return nextSearchParams;
  }

  if (state.selection.type === "set" && state.selection.variableset?.id) {
    nextSearchParams.set(SELECTION_TYPE_PARAM, "set");
    nextSearchParams.set(SET_PARAM, state.selection.variableset.id);
    nextSearchParams.delete(VARIABLE_PARAM);
    nextSearchParams.delete(PARENT_SET_PARAM);
    return nextSearchParams;
  }

  nextSearchParams.delete(SELECTION_TYPE_PARAM);
  nextSearchParams.delete(VARIABLE_PARAM);
  nextSearchParams.delete(SET_PARAM);
  nextSearchParams.delete(PARENT_SET_PARAM);

  return nextSearchParams;
}

export function matchesAdhocUrlSelection(
  selection: SelectionItem | null,
  parsedSelection: ParsedAdhocUrlSelection | null
) {
  if (!selection || !parsedSelection) {
    return selection === parsedSelection;
  }

  if (selection.type !== parsedSelection.type) {
    return false;
  }

  if (parsedSelection.type === "set") {
    return selection.variableset?.id === parsedSelection.variablesetId;
  }

  if (!selection.variable) {
    return false;
  }

  if (selection.variable.name !== parsedSelection.variableName) {
    return false;
  }

  if (!parsedSelection.parentVariablesetId) {
    return true;
  }

  return selection.parentVariableset?.id === parsedSelection.parentVariablesetId;
}

export function findVariablesetTreeNode(
  nodes: VariablesetTreeNode[],
  variablesetId: string
): VariablesetTreeNode | null {
  for (const node of nodes) {
    if (node.id === variablesetId) {
      return node;
    }

    const nestedNode = findVariablesetTreeNode(node.children, variablesetId);
    if (nestedNode) {
      return nestedNode;
    }
  }

  return null;
}
