import {
  type CreateDatasetVariableData,
  type DatasetVariable,
  type UpdateDatasetVariableData,
  type VariablesetContentAttributes,
  insertDatasetVariableSchema,
  selectDatasetVariableSchema,
  updateDatasetVariableSchema,
} from "@repo/database/schema";

export {
  insertDatasetVariableSchema,
  selectDatasetVariableSchema,
  updateDatasetVariableSchema,
  type DatasetVariable,
  type CreateDatasetVariableData,
  type UpdateDatasetVariableData,
};

// Extended type for variables that include attributes from variableset contents
export type DatasetVariableWithAttributes = DatasetVariable & {
  attributes?: VariablesetContentAttributes | null;
};
