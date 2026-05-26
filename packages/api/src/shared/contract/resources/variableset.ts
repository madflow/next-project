import { oc } from "@orpc/contract";
import { z } from "zod";
import {
  selectDatasetVariableSchema,
  selectDatasetVariablesetContentSchema,
  selectDatasetVariablesetSchema,
  variablesetContentAttributes,
} from "@repo/database/schema";
import { createCollectionResultSchema } from "../collection";

const variablesetIdSchema = z.object({
  id: z.uuid(),
});

const datasetVariablesetIdSchema = z.object({
  id: z.uuid(),
  setId: z.uuid(),
});

const variablesetContentIdSchema = variablesetIdSchema.extend({
  contentId: z.uuid(),
});

const variablesetVariableIdSchema = variablesetIdSchema.extend({
  variableId: z.uuid(),
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

const mutationSuccessResultSchema = z.object({
  success: z.literal(true),
});

const createVariablesetContentBodySchema = z.object({
  attributes: variablesetContentAttributes.optional().nullable(),
  contentType: z.enum(["variable", "subset"]),
  referenceId: z.uuid(),
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

const createVariablesetContentContract = oc
  .input(
    z.object({
      body: createVariablesetContentBodySchema,
      params: variablesetIdSchema,
    })
  )
  .output(selectDatasetVariablesetContentSchema)
  .route({
    inputStructure: "detailed",
    method: "POST",
    path: "/variablesets/{id}/contents",
  });

const deleteVariablesetContentContract = oc
  .input(variablesetContentIdSchema)
  .output(mutationSuccessResultSchema)
  .route({
    method: "DELETE",
    path: "/variablesets/{id}/contents/{contentId}",
  });

const reorderVariablesetContentsContract = oc
  .input(
    z.object({
      body: z.object({
        contentIds: z.array(z.uuid()),
      }),
      params: variablesetIdSchema,
    })
  )
  .output(mutationSuccessResultSchema)
  .route({
    inputStructure: "detailed",
    method: "PUT",
    path: "/variablesets/{id}/contents/reorder",
  });

const updateVariablesetVariableAttributesContract = oc
  .input(
    z.object({
      body: variablesetContentAttributes.nullable(),
      params: variablesetVariableIdSchema,
    })
  )
  .output(selectDatasetVariablesetContentSchema)
  .route({
    inputStructure: "detailed",
    method: "PUT",
    path: "/variablesets/{id}/variables/{variableId}/attributes",
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
    create: createVariablesetContentContract,
    delete: deleteVariablesetContentContract,
    get: getVariablesetContentsContract,
    reorder: reorderVariablesetContentsContract,
    updateAttributes: updateVariablesetVariableAttributesContract,
  },
  datasetVariables: {
    list: listDatasetVariablesetVariablesContract,
  },
  variables: {
    list: listVariablesetVariablesContract,
  },
};
