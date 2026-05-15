import { oc } from "@orpc/contract";
import { z } from "zod";
import { selectDatasetSchema, selectDatasetSplitVariableSchema, selectOrganizationSchema } from "@repo/database/schema";
import { collectionEmbedInputSchema, collectionInputSchema, createCollectionResultSchema } from "../collection";
import { listDatasetProjectResultSchema } from "./dataset-project";
import { listDatasetSplitVariableResultSchema } from "./dataset-split-variable";
import { listDatasetVariableResultSchema } from "./dataset-variable";
import { datasetVariablesetHierarchyResultSchema, listDatasetVariablesetResultSchema } from "./dataset-variableset";

const listDatasetRowSchema = selectDatasetSchema.extend({
  organization: selectOrganizationSchema.optional(),
});

const listDatasetResultSchema = createCollectionResultSchema(listDatasetRowSchema);
const datasetIdSchema = z.object({
  id: z.uuid(),
});

const listDatasetContract = oc.input(collectionInputSchema).output(listDatasetResultSchema).route({
  method: "GET",
  path: "/datasets",
});

const getDatasetContract = oc
  .input(datasetIdSchema.merge(collectionEmbedInputSchema))
  .output(listDatasetRowSchema)
  .route({
    method: "GET",
    path: "/datasets/{id}",
  });

const listDatasetVariablesContract = oc
  .input(datasetIdSchema.merge(collectionInputSchema))
  .output(listDatasetVariableResultSchema)
  .route({
    method: "GET",
    path: "/datasets/{id}/variables",
  });

const listDatasetAvailableSplitVariablesContract = oc
  .input(datasetIdSchema.merge(collectionInputSchema))
  .output(listDatasetVariableResultSchema)
  .route({
    method: "GET",
    path: "/datasets/{id}/variables/available-for-split",
  });

const listDatasetUnassignedVariablesContract = oc
  .input(datasetIdSchema.merge(collectionInputSchema))
  .output(listDatasetVariableResultSchema)
  .route({
    method: "GET",
    path: "/datasets/{id}/variables/unassigned",
  });

const listDatasetProjectsContract = oc
  .input(datasetIdSchema.merge(collectionInputSchema))
  .output(listDatasetProjectResultSchema)
  .route({
    method: "GET",
    path: "/datasets/{id}/projects",
  });

const listDatasetSplitVariablesContract = oc
  .input(datasetIdSchema.merge(collectionInputSchema))
  .output(listDatasetSplitVariableResultSchema)
  .route({
    method: "GET",
    path: "/datasets/{id}/splitvariables",
  });

const datasetSplitVariableIdSchema = datasetIdSchema.extend({
  variableId: z.uuid(),
});

const createDatasetSplitVariableContract = oc
  .input(datasetSplitVariableIdSchema)
  .output(selectDatasetSplitVariableSchema)
  .route({
    method: "POST",
    path: "/datasets/{id}/splitvariables/{variableId}",
  });

const deleteDatasetSplitVariableResultSchema = z.object({
  success: z.literal(true),
});

const deleteDatasetSplitVariableContract = oc
  .input(datasetSplitVariableIdSchema)
  .output(deleteDatasetSplitVariableResultSchema)
  .route({
    method: "DELETE",
    path: "/datasets/{id}/splitvariables/{variableId}",
  });

const datasetVariablesetsListInputSchema = datasetIdSchema.merge(
  collectionInputSchema.extend({
    hierarchical: z.string().optional(),
    limit: z.coerce.number().int().min(1).default(10),
  })
);

const listDatasetVariablesetsContract = oc
  .input(datasetVariablesetsListInputSchema)
  .output(z.union([listDatasetVariablesetResultSchema, datasetVariablesetHierarchyResultSchema]))
  .route({
    method: "GET",
    path: "/datasets/{id}/variablesets",
  });

export const datasetContract = {
  get: getDatasetContract,
  list: listDatasetContract,
  projects: {
    list: listDatasetProjectsContract,
  },
  splitVariables: {
    create: createDatasetSplitVariableContract,
    delete: deleteDatasetSplitVariableContract,
    list: listDatasetSplitVariablesContract,
  },
  variablesets: {
    list: listDatasetVariablesetsContract,
  },
  variables: {
    availableForSplit: listDatasetAvailableSplitVariablesContract,
    list: listDatasetVariablesContract,
    unassigned: listDatasetUnassignedVariablesContract,
  },
};
