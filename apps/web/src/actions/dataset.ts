"use server";

import { PutObjectCommand, S3ServiceException } from "@aws-sdk/client-s3";
import { createHash, randomUUID } from "crypto";
import { headers } from "next/headers";
import { defaultClient as db } from "@repo/database/clients";
import {
  CreateDatasetVariableData,
  DatasetVariableValueLabel,
  dataset,
  datasetProject,
  datasetVariable,
  insertDatasetVariableSchema,
} from "@repo/database/schema";
import { deleteDataset } from "@/dal/dataset";
import { env } from "@/env";
import { createAnalysisClient } from "@/lib/analysis-client";
import { USER_ADMIN_ROLE, auth } from "@/lib/auth";
import {
  ServerActionException,
  ServerActionNotAuthorizedException,
  ServerActionValidationException,
} from "@/lib/exception";
import { getS3Client } from "@/lib/storage";
import { datasetReadResponseSchema } from "@/types/dataset";

const ALLOWED_FILE_TYPES = [
  "application/x-spss-sav", // .sav
  // "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  // "text/csv",
  // "application/vnd.oasis.opendocument.spreadsheet", // .ods
  // "application/octet-stream", // .parquet
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export type UploadDatasetResult = {
  success: boolean;
  datasetId?: string;
  key?: string;
  error?: string;
  details?: unknown;
};

type UploadDatasetParams = {
  file: File;
  name: string;
  organizationId: string;
  description?: string;
  contentType: string;
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
}: UploadDatasetParams): Promise<UploadDatasetResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  try {
    if (!session?.user) {
      throw new ServerActionNotAuthorizedException("Unauthorized");
    }

    if (!ALLOWED_FILE_TYPES.includes(contentType) && !file.name.match(/\.(sav)$/i)) {
      throw new ServerActionValidationException("Invalid file type. Allowed types: .sav");
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new ServerActionValidationException(`File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    const s3Client = getS3Client();
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
    const fileKey = `${randomUUID()}.${fileExtension}`;
    const s3Key = `uploads/${fileKey}`;

    // Read file content and compute MD5 hash
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileHash = createHash("md5").update(fileBuffer).digest("hex");

    // Upload to S3
    const uploadParams = {
      Bucket: env.S3_BUCKET_NAME,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: contentType || "application/octet-stream",
      Metadata: {
        "original-filename": file.name,
        "uploaded-by": session.user.id,
        "organization-id": organizationId,
        "content-type": contentType,
        "file-hash": fileHash,
      },
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    // Save to database
    const result = await db
      .insert(dataset)
      .values({
        name: name,
        filename: file.name,
        fileType: fileExtension,
        fileSize: file.size,
        fileHash: fileHash,
        storageKey: s3Key,
        organizationId,
        description: description || undefined,
        uploadedAt: new Date(),
        updatedAt: new Date(),
        createdAt: new Date(),
      })
      .returning({ id: dataset.id });

    if (!result[0]?.id) {
      throw new ServerActionException("Failed to save file metadata to database");
    }

    const { fetch: analysisFetch } = createAnalysisClient();
    const fileMetadataResp = await analysisFetch(`/datasets/${result[0]?.id}/metadata`);
    if (!fileMetadataResp.ok) {
      throw new ServerActionException("Failed to fetch file metadata from analysis service");
    }
    const metadataResult = await fileMetadataResp.json();
    const datasetReadResponse = datasetReadResponseSchema.safeParse(metadataResult);
    if (!datasetReadResponse.success) {
      console.log(datasetReadResponse.error);
      throw new ServerActionException("Failed to fetch file metadata from analysis service");
    }

    const { metadata } = datasetReadResponse.data;

    const insertValues: CreateDatasetVariableData[] = [];
    for (const columnName of metadata.column_names) {
      const columnLabel = metadata.column_names_to_labels[columnName] as string;

      const variableValues = metadata.variable_value_labels[columnName] ?? {};

      const columnValueLabels: DatasetVariableValueLabel = {};
      for (const [value, label] of Object.entries(variableValues)) {
        columnValueLabels[value] = label;
      }

      const columnLabels = {
        default: columnLabel,
      };

      const insertVariable = insertDatasetVariableSchema.parse({
        name: columnName,
        label: columnLabel,
        measure: metadata.variable_measure[columnName],
        type: metadata.readstat_variable_types[columnName],
        variableLabels: columnLabels,
        valueLabels: columnValueLabels,
        datasetId: result[0].id,
      } as CreateDatasetVariableData);

      insertValues.push(insertVariable);
    }

    await db.insert(datasetVariable).values(insertValues);

    return {
      success: true,
      datasetId: result[0].id,
      key: s3Key,
    };
  } catch (error) {
    console.error("Error uploading dataset:", error);

    let errorMessage = "Failed to upload file";
    if (error instanceof S3ServiceException) {
      errorMessage = `S3 Error: ${error.name} - ${error.message}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined,
    };
  }
}

export async function remove(datasetId: string) {
  await deleteDataset(datasetId);
}
