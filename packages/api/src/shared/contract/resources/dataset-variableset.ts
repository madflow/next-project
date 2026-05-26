import { oc } from "@orpc/contract";
import { z } from "zod";
import {
  insertDatasetVariablesetSchema,
  selectDatasetSchema,
  selectDatasetVariablesetSchema,
  updateDatasetVariablesetSchema,
} from "@repo/database/schema";
import { collectionInputSchema, createCollectionResultSchema } from "../collection";
import { emptyUpdateMessage, hasUpdateChanges } from "../update";

const listDatasetVariablesetRowSchema = selectDatasetVariablesetSchema.extend({
  dataset: selectDatasetSchema.optional(),
  parent: selectDatasetVariablesetSchema.optional(),
});

export const listDatasetVariablesetResultSchema = createCollectionResultSchema(listDatasetVariablesetRowSchema);

const variablesetTreeNodeBaseSchema = z.object({
  attributes: selectDatasetVariablesetSchema.shape.attributes.nullable().optional(),
  category: selectDatasetVariablesetSchema.shape.category,
  description: selectDatasetVariablesetSchema.shape.description.nullable().optional(),
  id: selectDatasetVariablesetSchema.shape.id,
  level: z.number().int().min(0),
  name: selectDatasetVariablesetSchema.shape.name,
  orderIndex: selectDatasetVariablesetSchema.shape.orderIndex.nullable().optional(),
  parentId: selectDatasetVariablesetSchema.shape.parentId.nullable().optional(),
  variableCount: z.number().int().min(0),
});

export type VariablesetTreeNode = z.infer<typeof variablesetTreeNodeBaseSchema> & {
  children: VariablesetTreeNode[];
};

const variablesetTreeNodeSchema: z.ZodType<VariablesetTreeNode> = variablesetTreeNodeBaseSchema.extend({
  children: z.lazy(() => variablesetTreeNodeSchema.array()),
});

export const datasetVariablesetHierarchyResultSchema = z.object({
  hierarchy: z.array(variablesetTreeNodeSchema),
});

const datasetVariablesetIdSchema = z.object({
  id: z.uuid(),
});

const listDatasetVariablesetContract = oc
  .input(collectionInputSchema)
  .output(listDatasetVariablesetResultSchema)
  .route({
    method: "GET",
    path: "/dataset-variablesets",
  });

const createDatasetVariablesetContract = oc
  .input(insertDatasetVariablesetSchema)
  .output(selectDatasetVariablesetSchema)
  .route({
    method: "POST",
    path: "/dataset-variablesets",
  });

const updateDatasetVariablesetBodySchema = updateDatasetVariablesetSchema.omit({ id: true }).refine(hasUpdateChanges, {
  message: emptyUpdateMessage,
});

const updateDatasetVariablesetContract = oc
  .input(
    z.object({
      body: updateDatasetVariablesetBodySchema,
      params: datasetVariablesetIdSchema,
    })
  )
  .output(selectDatasetVariablesetSchema)
  .route({
    inputStructure: "detailed",
    method: "PUT",
    path: "/dataset-variablesets/{id}",
  });

const deleteDatasetVariablesetContract = oc
  .input(datasetVariablesetIdSchema)
  .output(selectDatasetVariablesetSchema)
  .route({
    method: "DELETE",
    path: "/dataset-variablesets/{id}",
  });

const datasetVariablesetMutationSuccessResultSchema = z.object({
  success: z.literal(true),
});

const reorderDatasetVariablesetsContract = oc
  .input(
    z.object({
      datasetId: z.uuid(),
      parentId: z.uuid().nullable(),
      reorderedIds: z.array(z.uuid()),
    })
  )
  .output(datasetVariablesetMutationSuccessResultSchema)
  .route({
    method: "POST",
    path: "/dataset-variablesets/reorder",
  });

const detachDatasetVariablesetContract = oc
  .input(datasetVariablesetIdSchema)
  .output(datasetVariablesetMutationSuccessResultSchema)
  .route({
    method: "POST",
    path: "/dataset-variablesets/{id}/detach",
  });

export const datasetVariablesetContract = {
  create: createDatasetVariablesetContract,
  delete: deleteDatasetVariablesetContract,
  detach: detachDatasetVariablesetContract,
  list: listDatasetVariablesetContract,
  reorder: reorderDatasetVariablesetsContract,
  update: updateDatasetVariablesetContract,
};
