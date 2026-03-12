import {
  type CreateDatasetVariablesetContentData,
  type CreateDatasetVariablesetData,
  type DatasetVariableset,
  type DatasetVariablesetCategory,
  type DatasetVariablesetContent,
  type DatasetVariablesetContentType,
  type UpdateDatasetVariablesetData,
  type ValueRange,
  type VariablesetContentAttributes,
  insertDatasetVariablesetContentSchema,
  insertDatasetVariablesetSchema,
  selectDatasetVariablesetContentSchema,
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
  // Variable set content schemas
  insertDatasetVariablesetContentSchema,
  selectDatasetVariablesetContentSchema,
  // Variable set content types
  type DatasetVariablesetContent,
  type CreateDatasetVariablesetContentData,
  type DatasetVariablesetContentType,
  type VariablesetContentAttributes,
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
