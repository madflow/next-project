import "server-only";
import { and, eq } from "drizzle-orm";
import {
  datasetProject,
  dataset as entity,
  member,
  organization,
  project,
  selectDatasetSchema,
} from "@repo/database/schema";
import {
  createFind,
  createList,
  getAuthenticatedClient,
  getSessionUser,
  withAdminCheck,
  withSessionCheck,
} from "@/lib/dal";
import { DalException, DalNotAuthorizedException } from "@/lib/exception";
import { deleteDataset as s3DeleteDataset } from "@/lib/storage";

export const find = withSessionCheck(createFind(entity, selectDatasetSchema));

export const list = withAdminCheck(createList(entity, selectDatasetSchema));

export const listAuthenticated = withSessionCheck(createList(entity, selectDatasetSchema));

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

export async function assertAccess(datasetId: string) {
  const canAccess = await hasAccess(datasetId);
  if (!canAccess) {
    throw new DalNotAuthorizedException("You do not have access to this dataset");
  }
}

export async function hasAccess(datasetId: string) {
  const user = await getSessionUser();
  if (!user) {
    return false;
  }

  if (user.role === "admin") {
    return true;
  }

  const db = await getAuthenticatedClient();

  const rows = await db
    .select()
    .from(entity)
    .innerJoin(datasetProject, eq(entity.id, datasetProject.datasetId))
    .innerJoin(project, eq(project.id, datasetProject.projectId))
    .innerJoin(organization, eq(organization.id, project.organizationId))
    .innerJoin(member, eq(member.organizationId, organization.id))
    .where(and(eq(member.userId, user.id), eq(entity.id, datasetId)));
  return rows.length === 1;
}
