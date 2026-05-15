import {
  GetObjectCommand,
  type GetObjectCommandInput,
  type GetObjectCommandOutput,
  S3Client,
} from "@aws-sdk/client-s3";
import { ORPCError } from "@orpc/server";
import { and, eq, sql } from "drizzle-orm";
import {
  type DatasetVariablesetContentType,
  type VariablesetContentAttributes,
  dataset,
  datasetVariableset,
  datasetVariablesetContent,
  member,
} from "@repo/database/schema";
import { VariableSetExportFileSchema, VariableSetImportOptionsSchema } from "../../shared/variableset-transfer";
import { authVoter } from "../auth/voter";
import { type Context, createORPCContext } from "../context";
import { requireDatasetAccess } from "../resources/dataset/access";
import { exportVariableSets, importVariableSets } from "../variableset-transfer";
import type { CreateOpenAPIHandlerOptions } from "./create-openapi-handler";

type RouteHandler = (args: { context: Context; params: Record<string, string>; request: Request }) => Promise<Response>;

type RouteDefinition = {
  handler: RouteHandler;
  method: string;
  pattern: string;
};

const customRoutes: RouteDefinition[] = [
  {
    method: "DELETE",
    pattern: "/variablesets/:id",
    handler: handleDeleteVariableset,
  },
  {
    method: "POST",
    pattern: "/variablesets/:id/contents",
    handler: handleCreateVariablesetContent,
  },
  {
    method: "DELETE",
    pattern: "/variablesets/:id/contents/:contentId",
    handler: handleDeleteVariablesetContent,
  },
  {
    method: "PUT",
    pattern: "/variablesets/:id/contents/reorder",
    handler: handleReorderVariablesetContents,
  },
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
    pattern: "/datasets/:id/variablesets/export",
    handler: handleDatasetVariablesetExport,
  },
  {
    method: "POST",
    pattern: "/datasets/:id/variablesets/import",
    handler: handleDatasetVariablesetImport,
  },
  {
    method: "GET",
    pattern: "/users/:id/avatars/:file",
    handler: handleUserAvatar,
  },
];

let s3ClientInstance: S3Client | null = null;

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

function getS3Client() {
  if (!s3ClientInstance) {
    const isTlsExplicitlyDisabled = ["1", "true", "yes"].includes(process.env.S3_DISABLE_TLS?.toLowerCase() ?? "");

    if (process.env.NODE_ENV === "production" && isTlsExplicitlyDisabled) {
      throw new Error("S3_DISABLE_TLS must not be enabled in production");
    }

    const credentials =
      process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
        ? { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY }
        : undefined;

    s3ClientInstance = new S3Client({
      credentials,
      region: process.env.S3_REGION,
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: true,
      tls: !isTlsExplicitlyDisabled,
    });
  }

  return s3ClientInstance;
}

async function getObject(input: GetObjectCommandInput): Promise<GetObjectCommandOutput> {
  return getS3Client().send(new GetObjectCommand(input));
}

async function bodyToBuffer(body: NonNullable<GetObjectCommandOutput["Body"]>): Promise<Buffer> {
  if (typeof body.transformToByteArray === "function") {
    return Buffer.from(await body.transformToByteArray());
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of body as AsyncIterable<Uint8Array | string>) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
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

async function assertDatasetExists(context: Context, datasetId: string) {
  const [datasetRecord] = await context.db
    .select({ id: dataset.id })
    .from(dataset)
    .where(eq(dataset.id, datasetId))
    .limit(1);

  if (!datasetRecord) {
    throw new ORPCError("NOT_FOUND", {
      message: "Dataset not found",
      status: 404,
    });
  }
}

function requireAdminRouteAccess(context: Context) {
  if (context.principal.kind === "anonymous" || !authVoter.canAccessAdminOperations(context.principal)) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "Unauthorized",
      status: 401,
    });
  }
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

async function getVariablesetRecord(context: Context, variablesetId: string) {
  const [variablesetRecord] = await context.db
    .select({
      datasetId: datasetVariableset.datasetId,
      id: datasetVariableset.id,
    })
    .from(datasetVariableset)
    .where(eq(datasetVariableset.id, variablesetId))
    .limit(1);

  if (!variablesetRecord) {
    throw new ORPCError("NOT_FOUND", {
      message: "Variableset not found",
      status: 404,
    });
  }

  return variablesetRecord;
}

async function addContentToVariableset(
  context: Context,
  variablesetId: string,
  contentType: DatasetVariablesetContentType,
  referenceId: string,
  attributes?: VariablesetContentAttributes | null
) {
  const maxPosition = await context.db
    .select({ maxPos: sql<number>`COALESCE(MAX(${datasetVariablesetContent.position}), -100)` })
    .from(datasetVariablesetContent)
    .where(eq(datasetVariablesetContent.variablesetId, variablesetId));

  const values = {
    variablesetId,
    position: (maxPosition[0]?.maxPos ?? -100) + 100,
    contentType,
    variableId: contentType === "variable" ? referenceId : null,
    subsetId: contentType === "subset" ? referenceId : null,
    attributes:
      contentType === "variable" ? (attributes ?? { allowedStatistics: { distribution: true, mean: false } }) : null,
  };

  if (contentType === "subset") {
    let created: (typeof values & { id: string }) | undefined;

    await context.db.transaction(async (tx) => {
      const [inserted] = await tx.insert(datasetVariablesetContent).values(values).returning();
      created = inserted;

      await tx
        .update(datasetVariableset)
        .set({ parentId: variablesetId, updatedAt: new Date() })
        .where(eq(datasetVariableset.id, referenceId));
    });

    if (!created) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to add content to variableset",
        status: 500,
      });
    }

    return created;
  }

  const [created] = await context.db.insert(datasetVariablesetContent).values(values).returning();

  if (!created) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Failed to add content to variableset",
      status: 500,
    });
  }

  return created;
}

async function removeContentFromVariableset(context: Context, variablesetId: string, contentId: string) {
  await context.db
    .delete(datasetVariablesetContent)
    .where(
      and(eq(datasetVariablesetContent.id, contentId), eq(datasetVariablesetContent.variablesetId, variablesetId))
    );
}

async function reorderContents(context: Context, variablesetId: string, reorderedContentIds: string[]) {
  const items = await context.db
    .select({ id: datasetVariablesetContent.id })
    .from(datasetVariablesetContent)
    .where(eq(datasetVariablesetContent.variablesetId, variablesetId));

  const existingIds = new Set(items.map((item) => item.id));

  if (
    reorderedContentIds.length !== items.length ||
    new Set(reorderedContentIds).size !== reorderedContentIds.length ||
    reorderedContentIds.some((contentId) => !existingIds.has(contentId))
  ) {
    throw new ORPCError("BAD_REQUEST", {
      message: "contentIds must exactly match the existing content IDs for this variable set",
      status: 400,
    });
  }

  await context.db.transaction(async (tx) => {
    for (let index = 0; index < reorderedContentIds.length; index++) {
      const contentId = reorderedContentIds[index];

      if (!contentId) {
        continue;
      }

      await tx
        .update(datasetVariablesetContent)
        .set({ position: index * 100, updatedAt: new Date() })
        .where(eq(datasetVariablesetContent.id, contentId));
    }
  });

  return { success: true };
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

async function handleDeleteVariableset({ context, params }: { context: Context; params: Record<string, string> }) {
  const variablesetId = getRequiredParam(params, "id");
  requireAdminRouteAccess(context);
  await getVariablesetRecord(context, variablesetId);
  await context.db.delete(datasetVariableset).where(eq(datasetVariableset.id, variablesetId));
  return Response.json({ success: true });
}

async function handleCreateVariablesetContent({
  context,
  params,
  request,
}: {
  context: Context;
  params: Record<string, string>;
  request: Request;
}) {
  const variablesetId = getRequiredParam(params, "id");
  requireAdminRouteAccess(context);
  await getVariablesetRecord(context, variablesetId);

  const body = (await request.json()) as {
    attributes?: VariablesetContentAttributes | null;
    contentType?: string;
    referenceId?: string;
  };

  if (!body.contentType || !body.referenceId) {
    return jsonError(400, "contentType and referenceId are required");
  }

  if (body.contentType !== "variable" && body.contentType !== "subset") {
    return jsonError(400, "contentType must be 'variable' or 'subset'");
  }

  const created = await addContentToVariableset(
    context,
    variablesetId,
    body.contentType,
    body.referenceId,
    body.attributes
  );
  return Response.json(created, { status: 201 });
}

async function handleDeleteVariablesetContent({
  context,
  params,
}: {
  context: Context;
  params: Record<string, string>;
}) {
  const variablesetId = getRequiredParam(params, "id");
  const contentId = getRequiredParam(params, "contentId");
  requireAdminRouteAccess(context);
  await getVariablesetRecord(context, variablesetId);
  await removeContentFromVariableset(context, variablesetId, contentId);
  return Response.json({ success: true });
}

async function handleReorderVariablesetContents({
  context,
  params,
  request,
}: {
  context: Context;
  params: Record<string, string>;
  request: Request;
}) {
  const variablesetId = getRequiredParam(params, "id");
  requireAdminRouteAccess(context);
  await getVariablesetRecord(context, variablesetId);

  const body = (await request.json()) as { contentIds?: string[] };

  if (!Array.isArray(body.contentIds)) {
    return jsonError(400, "contentIds must be an array");
  }

  if (new Set(body.contentIds).size !== body.contentIds.length) {
    return jsonError(400, "contentIds must not contain duplicates");
  }

  const result = await reorderContents(context, variablesetId, body.contentIds);
  return Response.json(result);
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

async function handleDatasetVariablesetExport({
  context,
  params,
}: {
  context: Context;
  params: Record<string, string>;
}) {
  const datasetId = getRequiredParam(params, "id");
  requireAdminRouteAccess(context);
  await assertDatasetExists(context, datasetId);

  const exportData = await exportVariableSets(context.db, datasetId);
  const date = new Date().toISOString().split("T")[0];
  const filename = `dataset-${exportData.metadata.datasetName.replace(/[^a-zA-Z0-9]/g, "_")}-variablesets-${date}.json`;

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      "Cache-Control": "private, max-age=0, must-revalidate",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "application/json",
    },
  });
}

async function handleDatasetVariablesetImport({
  context,
  params,
  request,
}: {
  context: Context;
  params: Record<string, string>;
  request: Request;
}) {
  const datasetId = getRequiredParam(params, "id");
  requireAdminRouteAccess(context);
  await assertDatasetExists(context, datasetId);

  const formData = await request.formData();
  const fileEntry = formData.get("file");
  const optionsEntry = formData.get("options");

  if (!(fileEntry instanceof File)) {
    return jsonError(400, "File is required");
  }

  if (!fileEntry.type.includes("json") && !fileEntry.name.endsWith(".json")) {
    return jsonError(400, "File must be a JSON file");
  }

  let options;
  try {
    const parsedOptions = typeof optionsEntry === "string" && optionsEntry.length > 0 ? JSON.parse(optionsEntry) : {};
    options = VariableSetImportOptionsSchema.parse(parsedOptions);
  } catch {
    return jsonError(400, "Invalid import options");
  }

  let importData;
  try {
    importData = VariableSetExportFileSchema.parse(JSON.parse(await fileEntry.text()));
  } catch {
    return jsonError(400, "Invalid file format. Please upload a valid variable sets export file.");
  }

  const result = await importVariableSets(context.db, datasetId, importData, options);
  return Response.json(result);
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
