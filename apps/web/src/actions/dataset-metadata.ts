"use server";

import { eq } from "drizzle-orm";
import { defaultClient as db } from "@repo/database/clients";
import { dataset as datasetEntity, datasetMetadataFile } from "@repo/database/schema";
import { findById } from "@/dal/dataset-metadata";
import { USER_ADMIN_ROLE } from "@/lib/auth";
import { validateMetadataFile } from "@/lib/document-validation";
import {
  ServerActionException,
  ServerActionNotAuthorizedException,
  ServerActionValidationException,
} from "@/lib/exception";
import { getSessionOrThrow, withDatasetAccess } from "@/lib/server-action-utils";
import { deleteDatasetMetadataFile, putDatasetMetadataFile } from "@/lib/storage";

type ActionResult = {
  success: boolean;
  error?: string;
};

export const uploadDatasetMetadataFile = withDatasetAccess(
  async (datasetId: string, formData: FormData): Promise<ActionResult> => {
    const session = await getSessionOrThrow();
    const file = formData.get("file");
    const metadataType = formData.get("metadataType");
    const name = (formData.get("name") as string | null)?.trim() || null;
    const description = (formData.get("description") as string | null)?.trim() || null;

    if (!(file instanceof File)) {
      throw new ServerActionValidationException("No file provided");
    }

    if (
      metadataType !== "questionnaire" &&
      metadataType !== "variable_descriptions" &&
      metadataType !== "documentation" &&
      metadataType !== "other"
    ) {
      throw new ServerActionValidationException("Invalid metadata type");
    }

    const validation = await validateMetadataFile(file);
    if (!validation.success) {
      return { success: false, error: validation.error };
    }

    const targetDataset = await db.query.dataset.findFirst({
      where: eq(datasetEntity.id, datasetId),
    });

    if (!targetDataset) {
      throw new ServerActionException("Dataset not found");
    }

    const { s3Key } = await putDatasetMetadataFile({
      buffer: validation.buffer,
      contentType: validation.mimeType,
      datasetId,
      extension: validation.extension,
      originalFilename: file.name,
      organizationId: targetDataset.organizationId,
      userId: session.user.id,
      fileHash: validation.fileHash,
    });

    try {
      await db.insert(datasetMetadataFile).values({
        datasetId,
        organizationId: targetDataset.organizationId,
        uploadedBy: session.user.id,
        name: name || file.name,
        description,
        fileType: validation.mimeType,
        fileSize: file.size,
        fileHash: validation.fileHash,
        storageKey: s3Key,
        metadataType,
        uploadedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      await deleteDatasetMetadataFile(s3Key);
      throw error;
    }

    return { success: true };
  }
);

export const removeDatasetMetadataFile = withDatasetAccess(
  async (datasetId: string, fileId: string): Promise<ActionResult> => {
    const session = await getSessionOrThrow();
    const file = await findById(fileId);

    if (!file || file.datasetId !== datasetId) {
      throw new ServerActionValidationException("Metadata file not found");
    }

    if (session.user.role !== USER_ADMIN_ROLE && file.uploadedBy !== session.user.id) {
      throw new ServerActionNotAuthorizedException("You can only delete files you uploaded");
    }

    await deleteDatasetMetadataFile(file.storageKey);
    await db.delete(datasetMetadataFile).where(eq(datasetMetadataFile.id, fileId));

    return { success: true };
  }
);
