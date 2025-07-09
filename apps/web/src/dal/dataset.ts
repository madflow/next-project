import "server-only";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { eq } from "drizzle-orm";
import { dataset as entity, selectDatasetSchema } from "@repo/database/schema";
import { env } from "@/env";
import { createFind, createList, getAuthenticatedClient, withAdminCheck, withSessionCheck } from "@/lib/dal";
import { DalException } from "@/lib/exception";
import { getS3Client } from "@/lib/storage";

export const find = withAdminCheck(createFind(entity, selectDatasetSchema));

export const list = withAdminCheck(createList(entity, selectDatasetSchema));

export const listAuthenticated = withSessionCheck(createList(entity, selectDatasetSchema));

export const deleteDataset = withAdminCheck(async (datasetId: string) => {
  const db = await getAuthenticatedClient();
  const s3Client = getS3Client();

  // Get the dataset first to get the S3 key
  const [dataset] = await db.select().from(entity).where(eq(entity.id, datasetId)).limit(1);

  if (!dataset) {
    throw new DalException("Dataset not found");
  }

  try {
    // Delete the file from S3 if it exists
    if (dataset.storageKey) {
      const deleteParams = {
        Bucket: env.S3_BUCKET_NAME,
        Key: dataset.storageKey,
      };

      await s3Client.send(new DeleteObjectCommand(deleteParams));
    }

    // Delete from database
    await db.delete(entity).where(eq(entity.id, datasetId));

    return { success: true };
  } catch (error) {
    console.error("Error deleting dataset:", error);
    throw new DalException("Failed to delete dataset. Please try again.");
  }
});
