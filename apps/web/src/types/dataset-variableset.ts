import {
  type CreateDatasetVariablesetContentData,
  type CreateDatasetVariablesetData,
  type CreateDatasetVariablesetItemData,
  type DatasetVariableset,
  type DatasetVariablesetCategory,
  type DatasetVariablesetContent,
  type DatasetVariablesetContentType,
  type DatasetVariablesetItem,
  type DatasetVariablesetItemAttributes,
  type UpdateDatasetVariablesetData,
  type ValueRange,
  insertDatasetVariablesetContentSchema,
  insertDatasetVariablesetItemSchema,
  insertDatasetVariablesetSchema,
  selectDatasetVariablesetContentSchema,
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
  // Variable set item schemas (legacy)
  insertDatasetVariablesetItemSchema,
  selectDatasetVariablesetItemSchema,
  // Variable set item types (legacy)
  type DatasetVariablesetItem,
  type CreateDatasetVariablesetItemData,
  // Variable set content schemas (new unified)
  insertDatasetVariablesetContentSchema,
  selectDatasetVariablesetContentSchema,
  // Variable set content types (new unified)
  type DatasetVariablesetContent,
  type CreateDatasetVariablesetContentData,
  type DatasetVariablesetContentType,
  type DatasetVariablesetItemAttributes,
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
