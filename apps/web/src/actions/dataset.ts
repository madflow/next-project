"use server";

import { revalidatePath } from "next/cache";
import { UpdateDatasetData } from "@repo/database/schema";
import {
  CreateDatasetResult,
  type DatasetFileUpdateResult,
  createDataset,
  previewDatasetFileUpdate,
  updateDatasetFile,
} from "@/lib/dataset-service";
import { getSessionOrThrow, withAdminAuth } from "@/lib/server-action-utils";
import { getServerAPIClient } from "@/lib/server-api-client";

type UploadDatasetResult = CreateDatasetResult;

/**
 * Upload dataset using FormData to properly handle file uploads
 */
export const uploadDatasetWithFormData = withAdminAuth(async (formData: FormData): Promise<UploadDatasetResult> => {
  const session = await getSessionOrThrow();

  const file = formData.get("file") as File | null;
  const name = formData.get("name") as string;
  const organizationId = formData.get("organizationId") as string;
  const description = formData.get("description") as string | undefined;
  const contentType = formData.get("contentType") as string;
  const missingValuesJson = formData.get("missingValues") as string | null;

  if (!file) {
    return {
      success: false,
      error: "No file provided",
    };
  }

  const missingValues = missingValuesJson ? JSON.parse(missingValuesJson) : null;

  return await createDataset({
    file,
    name,
    organizationId,
    description,
    contentType,
    missingValues,
    userId: session.user.id,
  });
});

export const addToProject = withAdminAuth(async (datasetId: string, projectId: string) => {
  const api = await getServerAPIClient();

  await api.dataset.projects.create({ datasetId, projectId });
});

export const remove = withAdminAuth(async (datasetId: string) => {
  const api = await getServerAPIClient();

  await api.dataset.delete({ id: datasetId });
});

export const update = withAdminAuth(async (datasetId: string, values: UpdateDatasetData) => {
  const api = await getServerAPIClient();
  const body = Object.fromEntries(Object.entries(values).filter(([key]) => key !== "id"));

  await api.dataset.update({
    body,
    params: { id: datasetId },
  });
});

export const previewDatasetFileUpdateWithFormData = withAdminAuth(
  async (formData: FormData): Promise<DatasetFileUpdateResult> => {
    const file = formData.get("file") as File | null;
    const datasetId = formData.get("datasetId") as string | null;
    const contentType = (formData.get("contentType") as string | null) ?? "application/octet-stream";

    if (!file) {
      return {
        success: false,
        error: "No file provided",
      };
    }

    if (!datasetId) {
      return {
        success: false,
        error: "No dataset provided",
      };
    }

    return previewDatasetFileUpdate({
      contentType,
      datasetId,
      file,
    });
  }
);

export const confirmDatasetFileUpdateWithFormData = withAdminAuth(
  async (formData: FormData): Promise<DatasetFileUpdateResult> => {
    const session = await getSessionOrThrow();
    const file = formData.get("file") as File | null;
    const datasetId = formData.get("datasetId") as string | null;
    const contentType = (formData.get("contentType") as string | null) ?? "application/octet-stream";
    const missingValuesJson = formData.get("missingValues") as string | null;

    if (!file) {
      return {
        success: false,
        error: "No file provided",
      };
    }

    if (!datasetId) {
      return {
        success: false,
        error: "No dataset provided",
      };
    }

    const missingValues = missingValuesJson ? JSON.parse(missingValuesJson) : null;
    const result = await updateDatasetFile({
      contentType,
      datasetId,
      file,
      missingValues,
      userId: session.user.id,
    });

    if (result.success) {
      revalidatePath("/admin/datasets");
      revalidatePath(`/admin/datasets/${datasetId}/editor`);
      revalidatePath(`/admin/datasets/${datasetId}/update-file`);
    }

    return result;
  }
);
