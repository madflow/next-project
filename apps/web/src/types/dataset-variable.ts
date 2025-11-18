import {
  type CreateDatasetVariableData,
  type DatasetVariable,
  type DatasetVariablesetItemAttributes,
  type UpdateDatasetVariableData,
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

// Extended type for variables that include attributes from variableset items
export type DatasetVariableWithAttributes = DatasetVariable & {
  attributes?: DatasetVariablesetItemAttributes | null;
};
