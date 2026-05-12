import {
  DeleteObjectCommand,
  type DeleteObjectCommandInput,
  type DeleteObjectCommandOutput,
  GetObjectCommand,
  type GetObjectCommandInput,
  type GetObjectCommandOutput,
  PutObjectCommand,
  type PutObjectCommandInput,
  type PutObjectCommandOutput,
  S3Client,
} from "@aws-sdk/client-s3";
import { createHash, randomUUID } from "node:crypto";

let s3ClientInstance: S3Client | null = null;

export const getS3Client = () => {
  if (!s3ClientInstance) {
    const credentials =
      process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
        ? { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY }
        : undefined;
    s3ClientInstance = new S3Client({
      credentials,
      region: process.env.S3_REGION,
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: true,
      tls: false,
    });
  }

  return s3ClientInstance;
};

export async function putObject(input: PutObjectCommandInput): Promise<PutObjectCommandOutput> {
  return getS3Client().send(new PutObjectCommand(input));
}

export async function getObject(input: GetObjectCommandInput): Promise<GetObjectCommandOutput> {
  return getS3Client().send(new GetObjectCommand(input));
}

export async function deleteObject(input: DeleteObjectCommandInput): Promise<DeleteObjectCommandOutput> {
  return getS3Client().send(new DeleteObjectCommand(input));
}

export async function bodyToBuffer(body: NonNullable<GetObjectCommandOutput["Body"]>): Promise<Buffer> {
  if (typeof body.transformToByteArray === "function") {
    return Buffer.from(await body.transformToByteArray());
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of body as AsyncIterable<Uint8Array | string>) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

export async function putDataset(file: File, contentType: string, organizationId: string, userId?: string) {
  const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
  const fileKey = `${randomUUID()}.${fileExtension}`;
  const s3Key = `uploads/${fileKey}`;

  // Read file content and compute MD5 hash
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const fileHash = createHash("md5").update(fileBuffer).digest("hex");

  // Upload to S3
  const uploadParams = {
    Bucket: process.env.S3_BUCKET_NAME,
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

  await putObject(uploadParams);
  return {
    s3Key,
    fileHash,
    fileExtension,
  };
}

export async function deleteDataset(storageKey: string) {
  await deleteObject({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: storageKey,
  });
}

export { S3ServiceException } from "@aws-sdk/client-s3";
