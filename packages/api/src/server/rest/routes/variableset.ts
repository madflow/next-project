import { ORPCError } from "@orpc/server";
import { and, eq, sql } from "drizzle-orm";
import {
  type DatasetVariablesetContentType,
  type VariablesetContentAttributes,
  dataset,
  datasetVariableset,
  datasetVariablesetContent,
} from "@repo/database/schema";
import { VariableSetExportFileSchema, VariableSetImportOptionsSchema } from "../../../shared/variableset-transfer";
import { authVoter } from "../../auth/voter";
import type { Context } from "../../context";
import { exportVariableSets, importVariableSets } from "../../resources/dataset-variableset/transfer-service";
import { createAttachmentContentDisposition } from "../content-disposition";
import type { RouteDefinition } from "./types";

function jsonError(status: number, message: string) {
  return Response.json({ error: message }, { status });
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
      "Content-Disposition": createAttachmentContentDisposition(filename),
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

export const variablesetRoutes: RouteDefinition[] = [
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
    method: "GET",
    pattern: "/datasets/:id/variablesets/export",
    handler: handleDatasetVariablesetExport,
  },
  {
    method: "POST",
    pattern: "/datasets/:id/variablesets/import",
    handler: handleDatasetVariablesetImport,
  },
];
