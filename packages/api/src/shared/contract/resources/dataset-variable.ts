import { oc } from "@orpc/contract";
import { z } from "zod";
import { selectDatasetSchema, selectDatasetVariableSchema, updateDatasetVariableSchema } from "@repo/database/schema";
import { collectionInputSchema, createCollectionResultSchema } from "../collection";
import { emptyUpdateMessage, hasUpdateChanges } from "../update";

const listDatasetVariableRowSchema = selectDatasetVariableSchema.extend({
  dataset: selectDatasetSchema.optional(),
});

export const listDatasetVariableResultSchema = createCollectionResultSchema(listDatasetVariableRowSchema);

const datasetVariableIdSchema = z.object({
  id: z.uuid(),
});

const listDatasetVariableContract = oc.input(collectionInputSchema).output(listDatasetVariableResultSchema).route({
  method: "GET",
  path: "/dataset-variables",
});

const getDatasetVariableContract = oc.input(datasetVariableIdSchema).output(selectDatasetVariableSchema).route({
  method: "GET",
  path: "/dataset-variables/{id}",
});

const updateDatasetVariableBodySchema = updateDatasetVariableSchema.omit({ id: true }).refine(hasUpdateChanges, {
  message: emptyUpdateMessage,
});

const updateDatasetVariableContract = oc
  .input(
    z.object({
      body: updateDatasetVariableBodySchema,
      params: datasetVariableIdSchema,
    })
  )
  .output(selectDatasetVariableSchema)
  .route({
    inputStructure: "detailed",
    method: "PUT",
    path: "/dataset-variables/{id}",
  });

const deleteDatasetVariableContract = oc.input(datasetVariableIdSchema).output(selectDatasetVariableSchema).route({
  method: "DELETE",
  path: "/dataset-variables/{id}",
});

export const datasetVariableContract = {
  delete: deleteDatasetVariableContract,
  get: getDatasetVariableContract,
  list: listDatasetVariableContract,
  update: updateDatasetVariableContract,
};
