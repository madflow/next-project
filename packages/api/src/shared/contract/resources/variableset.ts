import { oc } from "@orpc/contract";
import { z } from "zod";
import {
  selectDatasetVariableSchema,
  selectDatasetVariablesetContentSchema,
  selectDatasetVariablesetSchema,
} from "@repo/database/schema";
import { createCollectionResultSchema } from "../collection";

const variablesetIdSchema = z.object({
  id: z.uuid(),
});

const datasetVariablesetIdSchema = z.object({
  id: z.uuid(),
  setId: z.uuid(),
});

const datasetVariablesetVariablesInputSchema = datasetVariablesetIdSchema.extend({
  limit: z.coerce.number().int().min(1).max(250).default(10),
  offset: z.coerce.number().int().min(0).default(0),
  search: z
    .string()
    .optional()
    .transform((value) => value?.trim() || undefined),
  unassigned: z.string().optional(),
});

const variablesetVariableRowSchema = selectDatasetVariableSchema.extend({
  attributes: selectDatasetVariablesetContentSchema.shape.attributes.optional(),
  orderIndex: z.number().int().optional(),
});

const listVariablesetVariableResultSchema = createCollectionResultSchema(variablesetVariableRowSchema);

const variablesetContentEntrySchema = selectDatasetVariablesetContentSchema.extend({
  subsetCategory: selectDatasetVariablesetSchema.shape.category.nullable(),
  subsetDescription: selectDatasetVariablesetSchema.shape.description.nullable(),
  subsetName: selectDatasetVariablesetSchema.shape.name.nullable(),
  variableLabel: selectDatasetVariableSchema.shape.label.nullable(),
  variableMeasure: selectDatasetVariableSchema.shape.measure.nullable(),
  variableName: selectDatasetVariableSchema.shape.name.nullable(),
  variableType: selectDatasetVariableSchema.shape.type.nullable(),
});

const getVariablesetContentsResultSchema = z.object({
  contents: z.array(variablesetContentEntrySchema),
});

const listVariablesetVariablesContract = oc
  .input(variablesetIdSchema)
  .output(listVariablesetVariableResultSchema)
  .route({
    method: "GET",
    path: "/variablesets/{id}/variables",
  });

const getVariablesetContentsContract = oc.input(variablesetIdSchema).output(getVariablesetContentsResultSchema).route({
  method: "GET",
  path: "/variablesets/{id}/contents",
});

const listDatasetVariablesetVariablesContract = oc
  .input(datasetVariablesetVariablesInputSchema)
  .output(listVariablesetVariableResultSchema)
  .route({
    method: "GET",
    path: "/datasets/{id}/variablesets/{setId}/variables",
  });

export const variablesetContract = {
  contents: {
    get: getVariablesetContentsContract,
  },
  datasetVariables: {
    list: listDatasetVariablesetVariablesContract,
  },
  variables: {
    list: listVariablesetVariablesContract,
  },
};
