import { randomUUID } from "node:crypto";
import { deleteStorageObject, putObject } from "@repo/storage";

type PutDatasetMetadataFileParams = {
  buffer: Buffer;
  contentType: string;
  datasetId: string;
  extension: string;
  fileHash: string;
  organizationId: string;
  originalFilename: string;
  userId: string;
};

export async function putDatasetMetadataFile({
  buffer,
  contentType,
  datasetId,
  extension,
  fileHash,
  organizationId,
  originalFilename,
  userId,
}: PutDatasetMetadataFileParams) {
  const fileKey = `${randomUUID()}.${extension.toLowerCase()}`;
  const s3Key = `datasets/${datasetId}/metadata/${fileKey}`;

  await putObject({
    Body: buffer,
    Bucket: process.env.S3_BUCKET_NAME,
    ContentType: contentType,
    Key: s3Key,
    Metadata: {
      "content-type": contentType,
      "dataset-id": datasetId,
      "file-hash": fileHash,
      "organization-id": organizationId,
      "original-filename": originalFilename,
      "uploaded-by": userId,
    },
  });

  return { s3Key };
}

export async function deleteDatasetMetadataFile(storageKey: string) {
  await deleteStorageObject(storageKey);
}
