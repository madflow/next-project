import {
  type CreateDatasetVariablesetData,
  type CreateDatasetVariablesetItemData,
  type DatasetVariableset,
  type DatasetVariablesetCategory,
  type DatasetVariablesetItem,
  type UpdateDatasetVariablesetData,
  type ValueRange,
  insertDatasetVariablesetItemSchema,
  insertDatasetVariablesetSchema,
  selectDatasetVariablesetItemSchema,
  selectDatasetVariablesetSchema,
  updateDatasetVariablesetSchema,
} from "@repo/database/schema";

export {
  // Variable set schemas
  insertDatasetVariablesetSchema,
  selectDatasetVariablesetSchema,
  updateDatasetVariablesetSchema,
  // Variable set types
  type DatasetVariableset,
  type DatasetVariablesetCategory,
  type CreateDatasetVariablesetData,
  type UpdateDatasetVariablesetData,
  // Variable set item schemas
  insertDatasetVariablesetItemSchema,
  selectDatasetVariablesetItemSchema,
  // Variable set item types
  type DatasetVariablesetItem,
  type CreateDatasetVariablesetItemData,
  // Value range type
  type ValueRange,
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
