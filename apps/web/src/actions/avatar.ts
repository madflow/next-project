"use server";

import { DeleteObjectCommand, ObjectCannedACL, PutObjectCommand, S3ServiceException } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { headers } from "next/headers";
import { env } from "@/env";
import { auth } from "@/lib/auth";
import { getS3Client } from "@/lib/storage";

type UploadAvatarParams = {
  file: File;
  userId: string;
  contentType: string;
};

export type UploadAvatarResult = {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
  details?: unknown;
  s3Response?: {
    etag?: string;
    versionId?: string;
  };
};

export async function uploadAvatar({ file, userId, contentType }: UploadAvatarParams): Promise<UploadAvatarResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session?.user?.id !== userId) {
    throw new Error("Unauthorized");
  }
  const s3Client = getS3Client();

  try {
    if (!file || !file.size) {
      throw new Error("No file provided or file is empty");
    }

    if (session.user.image) {
      // Extract just the filename from the full path
      const filename = session.user.image.split("/").pop() || "";
      if (filename) {
        await deleteAvatar(userId, filename);
      }
    }

    const fileExtension = file.name.split(".").pop() || "bin";
    const key = `avatars/${userId}/${randomUUID()}.${fileExtension}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const params = {
      Bucket: env.S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: "public-read" as ObjectCannedACL,
      Metadata: {
        "original-filename": file.name,
        "uploaded-by": userId,
        "uploaded-at": new Date().toISOString(),
      },
    };

    const command = new PutObjectCommand(params);
    const response = await s3Client.send(command);

    // Extract just the filename from the key
    const filename = key.split("/").pop() || key;

    const result = {
      success: true,
      url: filename,
      key: filename,
      s3Response: {
        etag: response.ETag,
        versionId: response.VersionId,
      },
    };
    return result;
  } catch (error: unknown) {
    console.error("Error uploading avatar to S3:", error);
    const errorDetails = {
      success: false as const,
      error: "Failed to upload avatar",
      details: undefined as Record<string, unknown> | undefined,
    };

    if (env.NODE_ENV === "development" && error instanceof Error) {
      const s3Error = error as S3ServiceException;
      errorDetails.details = {
        name: error.name,
        message: error.message,
        code: s3Error.$metadata?.httpStatusCode,
        requestId: s3Error.$metadata?.requestId,
        bucket: env.S3_BUCKET_NAME,
        region: env.S3_REGION,
        endpoint: env.S3_ENDPOINT,
        hasCredentials: !!(env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY),
      };
    }

    if (error && typeof error === "object" && "name" in error) {
      const errorName = String(error.name);

      if (errorName === "NoSuchBucket") {
        throw new Error("The specified bucket does not exist");
      } else if (errorName === "AccessDenied") {
        throw new Error("Access denied to S3 bucket");
      } else if (errorName === "InvalidAccessKeyId") {
        throw new Error("Invalid AWS access key ID");
      } else if (errorName === "SignatureDoesNotMatch") {
        throw new Error("Invalid AWS secret access key");
      }
    }

    return errorDetails;
  }
}

// Direct upload function that doesn't use presigned URLs
export async function getAvatarUrl(userId: string, filename: string): Promise<string> {
  return `/api/users/${userId}/avatars/${encodeURIComponent(filename)}`;
}

export async function deleteAvatar(userId: string, filename: string) {
  const s3Client = getS3Client();
  try {
    // Construct the full S3 key with the correct path
    const key = `avatars/${userId}/${filename}`;

    const command = new DeleteObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    return { success: true };
  } catch (error) {
    console.error("Error deleting avatar from S3:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete avatar",
    };
  }
}
