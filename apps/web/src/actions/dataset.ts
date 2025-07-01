"use server";

import { PutObjectCommand, S3ServiceException } from "@aws-sdk/client-s3";
import { createHash, randomUUID } from "crypto";
import { headers } from "next/headers";
import { defaultClient as db } from "@repo/database/clients";
import { dataset } from "@repo/database/schema";
import { env } from "@/env";
import { auth } from "@/lib/auth";
import { getS3Client } from "@/lib/storage";

const ALLOWED_FILE_TYPES = [
  "application/x-spss-sav", // .sav
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "text/csv",
  "application/vnd.oasis.opendocument.spreadsheet", // .ods
  "application/octet-stream", // .parquet
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export type UploadDatasetResult = {
  success: boolean;
  datasetId?: string;
  url?: string;
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
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    if (!organizationId) {
      return {
        success: false,
        error: "Organization is required",
      };
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(contentType) && !file.name.match(/\.(sav|xlsx|csv|ods|parquet)$/i)) {
      return {
        success: false,
        error: `Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(", ")}`,
      };
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
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
      throw new Error("Failed to save file metadata to database");
    }

    return {
      success: true,
      datasetId: result[0].id,
      key: s3Key,
      url: `https://${env.S3_BUCKET_NAME}.s3.${env.S3_REGION}.amazonaws.com/${s3Key}`,
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
