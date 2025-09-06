import {
  type CreateDatasetVariablesetData,
  type CreateDatasetVariablesetItemData,
  type DatasetVariableset,
  type DatasetVariablesetItem,
  type UpdateDatasetVariablesetData,
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
  type CreateDatasetVariablesetData,
  type UpdateDatasetVariablesetData,
  // Variable set item schemas
  insertDatasetVariablesetItemSchema,
  selectDatasetVariablesetItemSchema,
  // Variable set item types
  type DatasetVariablesetItem,
  type CreateDatasetVariablesetItemData,
};

// Extended types for UI components
export type DatasetVariablesetWithDetails = DatasetVariableset & {
  variableCount: number;
  children?: DatasetVariablesetWithDetails[];
};

export type VariablesetTreeNode = {
  id: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  variableCount: number;
  children: VariablesetTreeNode[];
  level: number;
};
