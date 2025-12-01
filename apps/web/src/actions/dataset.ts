"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { defaultClient as db } from "@repo/database/clients";
import { UpdateDatasetData, dataset, datasetProject } from "@repo/database/schema";
import { deleteDataset } from "@/dal/dataset";
import { USER_ADMIN_ROLE, auth } from "@/lib/auth";
import { CreateDatasetResult, createDataset } from "@/lib/dataset-service";
import { ServerActionNotAuthorizedException } from "@/lib/exception";

export type UploadDatasetResult = CreateDatasetResult;

type UploadDatasetParams = {
  file: File;
  name: string;
  organizationId: string;
  description?: string;
  contentType: string;
  missingValues: string[] | null;
};

/**
 * Upload dataset using FormData to properly handle file uploads
 */
export async function uploadDatasetWithFormData(formData: FormData): Promise<UploadDatasetResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new ServerActionNotAuthorizedException("Unauthorized");
  }

  if (session.user.role !== USER_ADMIN_ROLE) {
    throw new ServerActionNotAuthorizedException("Unauthorized");
  }

  // Extract data from FormData
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
}

export async function addToProject(datasetId: string, projectId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new ServerActionNotAuthorizedException("Unauthorized");
  }

  if (session.user.role !== USER_ADMIN_ROLE) {
    throw new ServerActionNotAuthorizedException("Unauthorized");
  }
  await db.insert(datasetProject).values({ projectId, datasetId });
}

export async function uploadDataset({
  file,
  name,
  organizationId,
  description,
  contentType,
  missingValues,
}: UploadDatasetParams): Promise<UploadDatasetResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new ServerActionNotAuthorizedException("Unauthorized");
  }

  if (session.user.role !== USER_ADMIN_ROLE) {
    throw new ServerActionNotAuthorizedException("Unauthorized");
  }

  return await createDataset({
    file,
    name,
    organizationId,
    description,
    contentType,
    missingValues,
    userId: session.user.id,
  });
}

export async function remove(datasetId: string) {
  await deleteDataset(datasetId);
}

export async function update(datasetId: string, values: UpdateDatasetData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new ServerActionNotAuthorizedException("Unauthorized");
  }

  if (session.user.role !== USER_ADMIN_ROLE) {
    throw new ServerActionNotAuthorizedException("Unauthorized");
  }

  await db.update(dataset).set(values).where(eq(dataset.id, datasetId));
}
