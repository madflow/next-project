import { NextResponse } from "next/server";
import { bodyToBuffer, getObject } from "@repo/storage";
import { assertAccess, find } from "@/dal/dataset";
import { env } from "@/env";
import { raiseExceptionResponse } from "@/lib/exception";

export const dynamic = "force-dynamic";

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

    const { storageKey, filename, fileType } = dataFile.datasets;
    const bucket = env.S3_BUCKET_NAME;

    try {
      // Get the file from S3
      const response = await getObject({
        Bucket: bucket,
        Key: storageKey,
        ResponseContentDisposition: `attachment; filename="${filename}"`,
      });

      if (!response.Body) {
        console.error("No file content received from S3");
        return new NextResponse("File not found", { status: 404 });
      }

      const buffer = await bodyToBuffer(response.Body);
      const body = new Uint8Array(buffer);

      // Return the file with appropriate headers
      return new NextResponse(body, {
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
