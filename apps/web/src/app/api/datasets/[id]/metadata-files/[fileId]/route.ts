import { GetObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { assertAccess } from "@/dal/dataset";
import { findById } from "@/dal/dataset-metadata";
import { env } from "@/env";
import { raiseExceptionResponse } from "@/lib/exception";
import { getS3Client } from "@/lib/storage";

export const dynamic = "force-dynamic";

const s3Client = getS3Client();

type RouteParams = {
  params: Promise<{
    id: string;
    fileId: string;
  }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  const { id, fileId } = await params;

  if (!id || !fileId) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  try {
    await assertAccess(id);

    const file = await findById(fileId);
    if (!file || file.datasetId !== id) {
      return new NextResponse("File not found", { status: 404 });
    }

    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: file.storageKey,
        ResponseContentDisposition: `attachment; filename="${file.name}"`,
      })
    );

    if (!response.Body) {
      return new NextResponse("File not found", { status: 404 });
    }

    const chunks: Uint8Array[] = [];
    // eslint-disable-next-line
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    return new NextResponse(buffer, {
      headers: {
        "Cache-Control": "private, max-age=0, must-revalidate",
        "Content-Disposition": `attachment; filename="${file.name}"`,
        "Content-Length": buffer.length.toString(),
        "Content-Type": file.fileType || "application/octet-stream",
      },
    });
  } catch (error) {
    console.error("Error downloading metadata file:", error, request.url);
    return raiseExceptionResponse(error);
  }
}
