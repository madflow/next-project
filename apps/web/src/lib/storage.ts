import { DeleteObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
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

export const testS3BucketAccess = async () => {
  try {
    const headBucketCommand = new HeadBucketCommand({
      Bucket: env.S3_BUCKET_NAME,
    });

    await getS3Client().send(headBucketCommand);

    return true;
  } catch (error) {
    throw new Error(`S3 bucket access test failed: ${error}`);
  }
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
