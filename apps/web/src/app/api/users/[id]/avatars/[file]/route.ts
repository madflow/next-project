import { GetObjectCommand } from "@aws-sdk/client-s3";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { env } from "@/env";
import { USER_ADMIN_ROLE, auth } from "@/lib/auth";
import { raiseExceptionResponse } from "@/lib/exception";
import { getS3Client } from "@/lib/storage";

export const dynamic = "force-dynamic";

const s3Client = getS3Client();

type RouteParams = {
  params: Promise<{
    id: string;
    file: string;
  }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  const { id, file } = await params;
  try {
    // Get the session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const canAccessAvatar = session.user.id === id || session.user.role === USER_ADMIN_ROLE;

    if (!canAccessAvatar) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const filePath = `avatars/${id}/${file}`;
    const bucket = env.S3_BUCKET_NAME;

    try {
      // Get the file from S3
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: filePath,
      });

      const response = await s3Client.send(command);

      if (!response.Body) {
        console.error("No file content received from S3");
        return new NextResponse("File not found", { status: 404 });
      }

      // Convert the ReadableStream to a Buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      // Determine content type
      const contentType = response.ContentType || "application/octet-stream";

      // Return the file content with appropriate headers
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Length": buffer.length.toString(),
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch (error) {
      return raiseExceptionResponse(error);
    }
  } catch (error) {
    return raiseExceptionResponse(error);
  }
}
