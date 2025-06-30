import "server-only";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { eq } from "drizzle-orm";
import { datafile as entity, selectDatafileSchema } from "@repo/database/schema";
import { env } from "@/env";
import { createFind, createList, getAuthenticatedClient, withAdminCheck, withSessionCheck } from "@/lib/dal";
import { getS3Client } from "@/lib/storage";

export const find = withAdminCheck(createFind(entity, selectDatafileSchema));

export const list = withAdminCheck(createList(entity, selectDatafileSchema));

export const listAuthenticated = withSessionCheck(createList(entity, selectDatafileSchema));

export const deleteDatafile = withAdminCheck(async (datafileId: string) => {
  const db = await getAuthenticatedClient();
  const s3Client = getS3Client();

  // Get the datafile first to get the S3 key
  const [datafile] = await db.select().from(entity).where(eq(entity.id, datafileId)).limit(1);

  if (!datafile) {
    throw new Error("Datafile not found");
  }

  try {
    // Delete the file from S3 if it exists
    if (datafile.storageKey) {
      const deleteParams = {
        Bucket: env.S3_BUCKET_NAME,
        Key: datafile.storageKey,
      };

      await s3Client.send(new DeleteObjectCommand(deleteParams));
    }

    // Delete from database
    await db.delete(entity).where(eq(entity.id, datafileId));

    return { success: true };
  } catch (error) {
    console.error("Error deleting datafile:", error);
    throw new Error("Failed to delete datafile. Please try again.");
  }
});
