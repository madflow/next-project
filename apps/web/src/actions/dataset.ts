"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { defaultClient as db } from "@repo/database/clients";
import { UpdateDatasetData, dataset, datasetProject } from "@repo/database/schema";
import { deleteDataset } from "@/dal/dataset";
import { USER_ADMIN_ROLE, auth } from "@/lib/auth";
import {
  ServerActionNotAuthorizedException,
} from "@/lib/exception";
import { createDataset, CreateDatasetResult } from "@/lib/dataset-service";

export type UploadDatasetResult = CreateDatasetResult;

type UploadDatasetParams = {
  file: File;
  name: string;
  organizationId: string;
  description?: string;
  contentType: string;
  missingValues: string[] | null;
};

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
