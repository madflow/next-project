import {
  type DatasetVariableset,
} from "@repo/database/schema";

export {
  // Variable set types
  type DatasetVariableset,
};

// Extended types for UI components
export type DatasetVariablesetWithDetails = DatasetVariableset & {
  variableCount: number;
  children?: DatasetVariablesetWithDetails[];
};

export type VariablesetTreeNode = {
  category: "general" | "multi_response";
  children: VariablesetTreeNode[];
  description?: string | null;
  id: string;
  level: number;
  name: string;
  orderIndex?: number | null;
  parentId?: string | null;
  variableCount: number;
  attributes?: DatasetVariableset["attributes"];
};
