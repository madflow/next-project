import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
import { dataset, datasetMetadataFile, member } from "@repo/database/schema";
import { bodyToBuffer, getObject } from "@repo/storage";
import { requireAdmin } from "../auth/guard";
import { authVoter } from "../auth/voter";
import { type Context, createORPCContext } from "../context";
import { requireDatasetAccess } from "../resources/dataset/access";
import { validateMetadataFile } from "../resources/dataset/metadata-validation";
import { deleteDatasetMetadataFile, putDatasetMetadataFile } from "../resources/dataset/storage";
import type { CreateOpenAPIHandlerOptions } from "./create-openapi-handler";
import type { RouteDefinition } from "./routes/types";
import { variablesetRoutes } from "./routes/variableset";

const customRoutes: RouteDefinition[] = [
  {
    method: "POST",
    pattern: "/datasets/:id/raw-data",
    handler: handleDatasetRawData,
  },
  {
    method: "POST",
    pattern: "/datasets/:id/stats",
    handler: handleDatasetStats,
  },
  {
    method: "POST",
    pattern: "/datasets/:id/exports/excel",
    handler: handleDatasetExcelExport,
  },
  {
    method: "POST",
    pattern: "/datasets/:id/exports/powerpoint",
    handler: handleDatasetPowerPointExport,
  },
  {
    method: "GET",
    pattern: "/datasets/:id/download",
    handler: handleDatasetDownload,
  },
  {
    method: "GET",
    pattern: "/datasets/:id/metadata-files",
    handler: handleDatasetMetadataFilesList,
  },
  {
    method: "POST",
    pattern: "/datasets/:id/metadata-files",
    handler: handleDatasetMetadataFilesCreate,
  },
  {
    method: "GET",
    pattern: "/datasets/:id/metadata-files/:fileId",
    handler: handleDatasetMetadataFileDownload,
  },
  {
    method: "DELETE",
    pattern: "/datasets/:id/metadata-files/:fileId",
    handler: handleDatasetMetadataFileDelete,
  },
  {
    method: "GET",
    pattern: "/users/:id/avatars/:file",
    handler: handleUserAvatar,
  },
  ...variablesetRoutes,
];

export function createCustomRouteHandler(options: CreateOpenAPIHandlerOptions) {
  return async (request: Request): Promise<Response | null> => {
    const pathname = new URL(request.url).pathname;
    const relativePath = stripPathPrefix(pathname, options.pathPrefix);

    if (relativePath === null) {
      return null;
    }

    for (const route of customRoutes) {
      if (route.method !== request.method) {
        continue;
      }

      const params = matchPath(relativePath, route.pattern);
      if (params === null) {
        continue;
      }

      try {
        const context = await createORPCContext({
          auth: options.auth,
          db: options.db,
          headers: request.headers,
        });

        return await route.handler({ context, params, request });
      } catch (error) {
        return toJsonErrorResponse(error);
      }
    }

    return null;
  };
}

function stripPathPrefix(pathname: string, pathPrefix: `/${string}`) {
  if (pathname === pathPrefix) {
    return "/";
  }

  if (pathname.startsWith(`${pathPrefix}/`)) {
    return pathname.slice(pathPrefix.length);
  }

  return null;
}

function matchPath(pathname: string, pattern: string) {
  const pathnameSegments = pathname.split("/").filter(Boolean);
  const patternSegments = pattern.split("/").filter(Boolean);

  if (pathnameSegments.length !== patternSegments.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let index = 0; index < patternSegments.length; index++) {
    const pathnameSegment = pathnameSegments[index];
    const patternSegment = patternSegments[index];

    if (!pathnameSegment || !patternSegment) {
      return null;
    }

    if (patternSegment.startsWith(":")) {
      params[patternSegment.slice(1)] = decodeURIComponent(pathnameSegment);
      continue;
    }

    if (pathnameSegment !== patternSegment) {
      return null;
    }
  }

  return params;
}

function jsonError(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

function toJsonErrorResponse(error: unknown) {
  if (error instanceof ORPCError) {
    return jsonError(error.status ?? 500, error.message);
  }

  console.error(error);
  return jsonError(500, "An error occurred");
}

function createJsonProxyResponse(data: unknown) {
  return Response.json(data);
}

function createAnalysisClient() {
  const baseUrl = process.env.ANALYSIS_API_URL ?? "";
  const defaultHeaders = new Headers({
    "Content-Type": "application/json",
    "X-API-KEY": process.env.ANALYSIS_API_KEY ?? "",
  });

  return {
    fetch: async (input: string, init?: RequestInit) => {
      const headers = new Headers(defaultHeaders);
      if (init?.headers) {
        new Headers(init.headers).forEach((value, key) => {
          headers.set(key, value);
        });
      }

      return fetch(baseUrl + input, {
        ...init,
        headers,
      });
    },
  };
}

function getRequiredParam(params: Record<string, string>, key: string) {
  const value = params[key];

  if (!value) {
    throw new ORPCError("BAD_REQUEST", {
      message: `${key} is required`,
      status: 400,
    });
  }

  return value;
}

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: `Missing environment variable: ${name}`,
      status: 500,
    });
  }

  return value;
}

async function requireDatasetRouteAccess(context: Context, datasetId: string) {
  try {
    await requireDatasetAccess(context, datasetId);
  } catch (error) {
    if (error instanceof ORPCError && (error.status === 401 || error.status === 403)) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "You do not have access to this dataset",
        status: 401,
      });
    }

    throw error;
  }
}

async function findDownloadableDataset(context: Context, datasetId: string) {
  if (context.principal.kind === "anonymous") {
    throw new ORPCError("UNAUTHORIZED", {
      message: "You do not have access to this dataset",
      status: 401,
    });
  }

  if (authVoter.canAccessAdminOperations(context.principal)) {
    const [dataFile] = await context.db.select().from(dataset).where(eq(dataset.id, datasetId)).limit(1);
    return dataFile ?? null;
  }

  const [result] = await context.db
    .select({ dataFile: dataset })
    .from(dataset)
    .innerJoin(member, eq(member.organizationId, dataset.organizationId))
    .where(and(eq(dataset.id, datasetId), eq(member.userId, context.principal.user.id)))
    .limit(1);

  if (!result) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "You do not have access to this dataset",
      status: 401,
    });
  }

  return result.dataFile;
}

function requireAuthenticatedUser(context: Context) {
  if (context.principal.kind === "anonymous") {
    throw new ORPCError("UNAUTHORIZED", {
      message: "Authentication required",
      status: 401,
    });
  }

  return context.principal.user;
}

function getMetadataType(value: FormDataEntryValue | null) {
  if (
    value === "questionnaire" ||
    value === "variable_descriptions" ||
    value === "documentation" ||
    value === "other"
  ) {
    return value;
  }

  throw new ORPCError("BAD_REQUEST", {
    message: "Invalid metadata type",
    status: 400,
  });
}

async function findDatasetMetadataFile(context: Context, datasetId: string, fileId: string) {
  const [file] = await context.db
    .select()
    .from(datasetMetadataFile)
    .where(and(eq(datasetMetadataFile.id, fileId), eq(datasetMetadataFile.datasetId, datasetId)))
    .limit(1);

  return file ?? null;
}

async function handleDatasetRawData({
  context,
  params,
  request,
}: {
  context: Context;
  params: Record<string, string>;
  request: Request;
}) {
  const datasetId = getRequiredParam(params, "id");
  await requireDatasetRouteAccess(context, datasetId);

  const analysisClient = createAnalysisClient();
  const analysisResponse = await analysisClient.fetch(`/datasets/${datasetId}/raw-data`, {
    body: await request.text(),
    method: "POST",
  });

  return createJsonProxyResponse(await analysisResponse.json());
}

async function handleDatasetStats({
  context,
  params,
  request,
}: {
  context: Context;
  params: Record<string, string>;
  request: Request;
}) {
  const datasetId = getRequiredParam(params, "id");
  await requireDatasetRouteAccess(context, datasetId);

  const analysisClient = createAnalysisClient();
  const analysisResponse = await analysisClient.fetch(`/datasets/${datasetId}/stats`, {
    body: await request.text(),
    method: "POST",
  });

  return createJsonProxyResponse(await analysisResponse.json());
}

async function handleDatasetExcelExport({
  context,
  params,
  request,
}: {
  context: Context;
  params: Record<string, string>;
  request: Request;
}) {
  const datasetId = getRequiredParam(params, "id");
  await requireDatasetRouteAccess(context, datasetId);

  const analysisClient = createAnalysisClient();
  const analysisResponse = await analysisClient.fetch(`/datasets/${datasetId}/exports/excel`, {
    body: await request.text(),
    method: "POST",
  });

  if (!analysisResponse.ok) {
    const contentType = analysisResponse.headers.get("Content-Type") ?? "application/json";

    if (contentType.includes("application/json")) {
      return Response.json(await analysisResponse.json(), { status: analysisResponse.status });
    }

    const errorText = await analysisResponse.text();
    return Response.json({ error: errorText || "Excel export failed" }, { status: analysisResponse.status });
  }

  const buffer = await analysisResponse.arrayBuffer();

  return new Response(buffer, {
    status: analysisResponse.status,
    headers: {
      "Cache-Control": "private, max-age=0, must-revalidate",
      "Content-Disposition":
        analysisResponse.headers.get("Content-Disposition") ?? 'attachment; filename="chart-export.xlsx"',
      "Content-Type":
        analysisResponse.headers.get("Content-Type") ??
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}

async function handleDatasetPowerPointExport({
  context,
  params,
  request,
}: {
  context: Context;
  params: Record<string, string>;
  request: Request;
}) {
  const datasetId = getRequiredParam(params, "id");
  await requireDatasetRouteAccess(context, datasetId);

  const analysisClient = createAnalysisClient();
  const analysisResponse = await analysisClient.fetch(`/datasets/${datasetId}/exports/powerpoint`, {
    body: await request.text(),
    method: "POST",
  });

  if (!analysisResponse.ok) {
    const contentType = analysisResponse.headers.get("Content-Type") ?? "application/json";

    if (contentType.includes("application/json")) {
      return Response.json(await analysisResponse.json(), { status: analysisResponse.status });
    }

    const errorText = await analysisResponse.text();
    return Response.json({ error: errorText || "PowerPoint export failed" }, { status: analysisResponse.status });
  }

  const buffer = await analysisResponse.arrayBuffer();

  return new Response(buffer, {
    status: analysisResponse.status,
    headers: {
      "Cache-Control": "private, max-age=0, must-revalidate",
      "Content-Disposition":
        analysisResponse.headers.get("Content-Disposition") ?? 'attachment; filename="chart-export.pptx"',
      "Content-Type":
        analysisResponse.headers.get("Content-Type") ??
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    },
  });
}

async function handleDatasetDownload({ context, params }: { context: Context; params: Record<string, string> }) {
  const datasetId = getRequiredParam(params, "id");
  const bucket = getRequiredEnv("S3_BUCKET_NAME");
  const dataFile = await findDownloadableDataset(context, datasetId);

  if (!dataFile) {
    return new Response("File not found", { status: 404 });
  }

  try {
    const response = await getObject({
      Bucket: bucket,
      Key: dataFile.storageKey,
      ResponseContentDisposition: `attachment; filename="${dataFile.filename}"`,
    });

    if (!response.Body) {
      console.error("No file content received from S3");
      return new Response("File not found", { status: 404 });
    }

    const buffer = await bodyToBuffer(response.Body);

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Cache-Control": "private, max-age=0, must-revalidate",
        "Content-Disposition": `attachment; filename="${dataFile.filename}"`,
        "Content-Length": buffer.length.toString(),
        "Content-Type": dataFile.fileType || "application/octet-stream",
      },
    });
  } catch (error) {
    console.error("Error fetching file from S3:", error);
    return new Response("Error retrieving file", { status: 500 });
  }
}

async function handleDatasetMetadataFilesList({
  context,
  params,
  request,
}: {
  context: Context;
  params: Record<string, string>;
  request: Request;
}) {
  const datasetId = getRequiredParam(params, "id");
  await requireDatasetRouteAccess(context, datasetId);

  const url = new URL(request.url);
  const limit = url.searchParams.get("limit") ?? "100";
  const offset = url.searchParams.get("offset") ?? "0";
  const search = url.searchParams.get("search") ?? undefined;
  const rows = await context.db
    .select()
    .from(datasetMetadataFile)
    .where(eq(datasetMetadataFile.datasetId, datasetId))
    .orderBy(datasetMetadataFile.uploadedAt);

  const filteredRows =
    search && search.trim().length > 0
      ? rows.filter(
          (row) =>
            row.name.toLowerCase().includes(search.toLowerCase()) ||
            (row.description ?? "").toLowerCase().includes(search.toLowerCase())
        )
      : rows;

  const sortedRows = [...filteredRows].sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  const paginatedRows = sortedRows.slice(Number(offset), Number(offset) + Number(limit));

  return Response.json({
    count: filteredRows.length,
    limit: Number(limit),
    offset: Number(offset),
    orderBy: [{ direction: "desc", field: "uploadedAt" }],
    rows: paginatedRows,
  });
}

async function handleDatasetMetadataFilesCreate({
  context,
  params,
  request,
}: {
  context: Context;
  params: Record<string, string>;
  request: Request;
}) {
  const datasetId = getRequiredParam(params, "id");
  await requireDatasetRouteAccess(context, datasetId);
  requireAdmin(context);
  const user = requireAuthenticatedUser(context);

  const [targetDataset] = await context.db.select().from(dataset).where(eq(dataset.id, datasetId)).limit(1);

  if (!targetDataset) {
    throw new ORPCError("NOT_FOUND", {
      message: "Dataset not found",
      status: 404,
    });
  }

  const formData = await request.formData();
  const fileEntry = formData.get("file");

  if (!(fileEntry instanceof File)) {
    throw new ORPCError("BAD_REQUEST", {
      message: "No file provided",
      status: 400,
    });
  }

  const validation = await validateMetadataFile(fileEntry);
  if (!validation.success) {
    return jsonError(400, validation.error);
  }

  const name = (formData.get("name") as string | null)?.trim() || fileEntry.name;
  const description = (formData.get("description") as string | null)?.trim() || null;
  const metadataType = getMetadataType(formData.get("metadataType"));

  const { s3Key } = await putDatasetMetadataFile({
    buffer: validation.buffer,
    contentType: validation.mimeType,
    datasetId,
    extension: validation.extension,
    fileHash: validation.fileHash,
    organizationId: targetDataset.organizationId,
    originalFilename: fileEntry.name,
    userId: user.id,
  });

  try {
    const [created] = await context.db
      .insert(datasetMetadataFile)
      .values({
        createdAt: new Date(),
        datasetId,
        description,
        fileHash: validation.fileHash,
        fileSize: fileEntry.size,
        fileType: validation.mimeType,
        metadataType,
        name,
        organizationId: targetDataset.organizationId,
        storageKey: s3Key,
        updatedAt: new Date(),
        uploadedAt: new Date(),
        uploadedBy: user.id,
      })
      .returning();

    return Response.json(created, { status: 201 });
  } catch (error) {
    await deleteDatasetMetadataFile(s3Key);
    throw error;
  }
}

async function handleDatasetMetadataFileDownload({
  context,
  params,
}: {
  context: Context;
  params: Record<string, string>;
}) {
  const datasetId = getRequiredParam(params, "id");
  const fileId = getRequiredParam(params, "fileId");
  await requireDatasetRouteAccess(context, datasetId);

  const file = await findDatasetMetadataFile(context, datasetId, fileId);
  if (!file) {
    return new Response("File not found", { status: 404 });
  }

  const response = await getObject({
    Bucket: getRequiredEnv("S3_BUCKET_NAME"),
    Key: file.storageKey,
    ResponseContentDisposition: `attachment; filename="${file.name}"`,
  });

  if (!response.Body) {
    return new Response("File not found", { status: 404 });
  }

  const buffer = await bodyToBuffer(response.Body);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Cache-Control": "private, max-age=0, must-revalidate",
      "Content-Disposition": `attachment; filename="${file.name}"`,
      "Content-Length": buffer.length.toString(),
      "Content-Type": file.fileType || "application/octet-stream",
    },
  });
}

async function handleDatasetMetadataFileDelete({
  context,
  params,
}: {
  context: Context;
  params: Record<string, string>;
}) {
  const datasetId = getRequiredParam(params, "id");
  const fileId = getRequiredParam(params, "fileId");
  await requireDatasetRouteAccess(context, datasetId);
  const user = requireAuthenticatedUser(context);
  const file = await findDatasetMetadataFile(context, datasetId, fileId);

  if (!file) {
    throw new ORPCError("NOT_FOUND", {
      message: "Metadata file not found",
      status: 404,
    });
  }

  if (!authVoter.canAccessAdminOperations(context.principal) && file.uploadedBy !== user.id) {
    throw new ORPCError("FORBIDDEN", {
      message: "You can only delete files you uploaded",
      status: 403,
    });
  }

  await context.db.delete(datasetMetadataFile).where(eq(datasetMetadataFile.id, fileId));

  return Response.json({ success: true });
}

async function handleUserAvatar({ context, params }: { context: Context; params: Record<string, string> }) {
  const userId = getRequiredParam(params, "id");
  const file = getRequiredParam(params, "file");
  const bucket = getRequiredEnv("S3_BUCKET_NAME");

  if (context.principal.kind === "anonymous") {
    return new Response("Unauthorized", { status: 401 });
  }

  const canAccessAvatar = context.principal.user.id === userId || authVoter.canAccessAdminOperations(context.principal);

  if (!canAccessAvatar) {
    return new Response("Forbidden", { status: 403 });
  }

  const response = await getObject({
    Bucket: bucket,
    Key: `avatars/${userId}/${file}`,
  });

  if (!response.Body) {
    return new Response("File not found", { status: 404 });
  }

  const buffer = await bodyToBuffer(response.Body);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": buffer.length.toString(),
      "Content-Type": response.ContentType || "application/octet-stream",
    },
    status: 200,
  });
}
