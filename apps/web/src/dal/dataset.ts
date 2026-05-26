import "server-only";
import { eq } from "drizzle-orm";
import { dataset as entity } from "@repo/database/schema";
import { deleteDataset as s3DeleteDataset } from "@repo/storage";
import { getAuthenticatedClient, withAdminCheck } from "@/dal/dal";
import { DalException } from "@/lib/exception";

export const deleteDataset = withAdminCheck(async (datasetId: string) => {
  const db = await getAuthenticatedClient();

  // Get the dataset first to get the S3 key
  const [dataset] = await db.select().from(entity).where(eq(entity.id, datasetId)).limit(1);

  if (!dataset) {
    throw new DalException("Dataset not found");
  }

  try {
    // Delete the file from S3 if it exists
    if (dataset.storageKey) {
      await s3DeleteDataset(dataset.storageKey);
    }

    // Delete from database
    await db.delete(entity).where(eq(entity.id, datasetId));

    return { success: true };
  } catch (error) {
    console.error("Error deleting dataset:", error);
    throw new DalException("Failed to delete dataset. Please try again.");
  }
});
