import { oc } from "@orpc/contract";
import { z } from "zod";
import { selectDatasetSchema, selectDatasetVariablesetSchema } from "@repo/database/schema";
import { collectionInputSchema, createCollectionResultSchema } from "../collection";

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

const listDatasetVariablesetContract = oc
  .input(collectionInputSchema)
  .output(listDatasetVariablesetResultSchema)
  .route({
    method: "GET",
    path: "/dataset-variablesets",
  });

export const datasetVariablesetContract = {
  list: listDatasetVariablesetContract,
};
