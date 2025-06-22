import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "@/env";

let s3ClientInstance: S3Client | null = null;

export const getS3Client = () => {
  if (!s3ClientInstance) {
    const credentials =
      env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY
        ? { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY }
        : undefined;

    console.log("credentials", credentials);

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
