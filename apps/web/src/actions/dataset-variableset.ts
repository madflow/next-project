"use server";

import {
  CreateDatasetVariablesetData,
  DatasetVariablesetContentType,
  UpdateDatasetVariablesetData,
  VariablesetContentAttributes,
} from "@repo/database/schema";
import { ServerActionValidationException } from "@/lib/exception";
import { withAdminAuth } from "@/lib/server-action-utils";
import { getServerAPIClient } from "@/lib/server-api-client";

export const createVariableset = withAdminAuth(async (data: CreateDatasetVariablesetData) => {
  const api = await getServerAPIClient();

  return api.datasetVariableset.create(data);
});

export const updateVariableset = withAdminAuth(async (id: string, data: UpdateDatasetVariablesetData) => {
  const api = await getServerAPIClient();
  const body = Object.fromEntries(Object.entries(data).filter(([key]) => key !== "id"));

  return api.datasetVariableset.update({
    body,
    params: { id },
  });
});

export const deleteVariableset = withAdminAuth(async (id: string) => {
  const api = await getServerAPIClient();

  await api.datasetVariableset.delete({ id });
});

export const updateContentAttributesAction = withAdminAuth(
  async (variablesetId: string, variableId: string, attributes: VariablesetContentAttributes | null) => {
    if (attributes?.valueRange && attributes.valueRange.min > attributes.valueRange.max) {
      throw new ServerActionValidationException("Min value must be less than or equal to max value");
    }

    const api = await getServerAPIClient();

    return api.variableset.contents.updateAttributes({
      body: attributes,
      params: {
        id: variablesetId,
        variableId,
      },
    });
  }
);

export const reorderVariablesetsAction = withAdminAuth(
  async (datasetId: string, parentId: string | null, reorderedIds: string[]) => {
    const api = await getServerAPIClient();

    return api.datasetVariableset.reorder({
      datasetId,
      parentId,
      reorderedIds,
    });
  }
);

export const addContentToVariablesetAction = withAdminAuth(
  async (
    variablesetId: string,
    contentType: DatasetVariablesetContentType,
    referenceId: string,
    attributes?: VariablesetContentAttributes | null
  ) => {
    const api = await getServerAPIClient();

    try {
      await api.variableset.contents.create({
        body: {
          attributes,
          contentType,
          referenceId,
        },
        params: { id: variablesetId },
      });

      return { success: true as const };
    } catch (error) {
      console.error("Failed to add content to variableset", error);

      if (error instanceof Error && "status" in error && typeof error.status === "number" && error.status < 500) {
        return { success: false as const, error: error.message };
      }

      return { success: false as const };
    }
  }
);

export const removeContentFromVariablesetAction = withAdminAuth(async (variablesetId: string, contentId: string) => {
  const api = await getServerAPIClient();

  await api.variableset.contents.delete({
    contentId,
    id: variablesetId,
  });
});

export const reorderContentsAction = withAdminAuth(async (variablesetId: string, reorderedContentIds: string[]) => {
  const api = await getServerAPIClient();

  return api.variableset.contents.reorder({
    body: {
      contentIds: reorderedContentIds,
    },
    params: { id: variablesetId },
  });
});

export const detachSubsetAction = withAdminAuth(async (subsetId: string) => {
  const api = await getServerAPIClient();

  await api.datasetVariableset.detach({ id: subsetId });
});
