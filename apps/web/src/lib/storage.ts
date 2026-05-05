import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createHash, randomUUID } from "node:crypto";
import { env } from "@/env";

let s3ClientInstance: S3Client | null = null;

export const getS3Client = () => {
  if (!s3ClientInstance) {
    const credentials =
      env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY
        ? { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY }
        : undefined;
    s3ClientInstance = new S3Client({
      credentials,
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      forcePathStyle: true,
      tls: false,
    });
  }

  return s3ClientInstance;
};

export async function putDataset(file: File, contentType: string, organizationId: string, userId?: string) {
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
      "uploaded-by": userId ?? "unknown",
      "organization-id": organizationId,
      "content-type": contentType,
      "file-hash": fileHash,
    },
  };

  const command = new PutObjectCommand(uploadParams);
  await s3Client.send(command);
  return {
    s3Key,
    fileHash,
    fileExtension,
  };
}

export async function deleteDataset(storageKey: string) {
  const deleteParams = {
    Bucket: env.S3_BUCKET_NAME,
    Key: storageKey,
  };

  await getS3Client().send(new DeleteObjectCommand(deleteParams));
}

type PutDatasetMetadataFileParams = {
  buffer: Buffer;
  contentType: string;
  datasetId: string;
  extension: string;
  originalFilename: string;
  organizationId: string;
  userId: string;
  fileHash: string;
};

export async function putDatasetMetadataFile({
  buffer,
  contentType,
  datasetId,
  extension,
  originalFilename,
  organizationId,
  userId,
  fileHash,
}: PutDatasetMetadataFileParams) {
  const safeExtension = extension.toLowerCase();
  const fileKey = `${randomUUID()}.${safeExtension}`;
  const s3Key = `datasets/${datasetId}/metadata/${fileKey}`;

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: contentType,
      Metadata: {
        "original-filename": originalFilename,
        "uploaded-by": userId,
        "dataset-id": datasetId,
        "organization-id": organizationId,
        "content-type": contentType,
        "file-hash": fileHash,
      },
    })
  );

  return { s3Key };
}

export async function deleteDatasetMetadataFile(storageKey: string) {
  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: storageKey,
    })
  );
}
