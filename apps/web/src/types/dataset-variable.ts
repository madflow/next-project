import {
  type DatasetVariable,
  type VariablesetContentAttributes,
  updateDatasetVariableSchema,
} from "@repo/database/schema";

export {
  updateDatasetVariableSchema,
  type DatasetVariable,
};

// Extended type for variables that include attributes from variableset contents
export type DatasetVariableWithAttributes = DatasetVariable & {
  attributes?: VariablesetContentAttributes | null;
};
