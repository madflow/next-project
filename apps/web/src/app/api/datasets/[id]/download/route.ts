import { GetObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { assertAccess, find } from "@/dal/dataset";
import { env } from "@/env";
import { raiseExceptionResponse } from "@/lib/exception";
import { getS3Client } from "@/lib/storage";

export const dynamic = "force-dynamic";

const s3Client = getS3Client();

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  try {
    await assertAccess(id);
    const dataFile = await find(id);

    if (!dataFile) {
      return new NextResponse("File not found", { status: 404 });
    }

    const { storageKey, filename, fileType } = dataFile;
    const bucket = env.S3_BUCKET_NAME;

    try {
      // Get the file from S3
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: storageKey,
        ResponseContentDisposition: `attachment; filename="${filename}"`,
      });

      const response = await s3Client.send(command);

      if (!response.Body) {
        console.error("No file content received from S3");
        return new NextResponse("File not found", { status: 404 });
      }

      // Convert the stream to a buffer
      const chunks: Uint8Array[] = [];
      // eslint-disable-next-line
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      // Return the file with appropriate headers
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": fileType || "application/octet-stream",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": buffer.length.toString(),
          "Cache-Control": "private, max-age=0, must-revalidate",
        },
      });
    } catch (s3Error) {
      console.error("Error fetching file from S3:", s3Error);
      return new NextResponse("Error retrieving file", { status: 500 });
    }
  } catch (error) {
    console.error("Error in datafile download:", error);
    return raiseExceptionResponse(error);
  }
}
