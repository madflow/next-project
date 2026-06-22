import { and, eq, inArray } from "drizzle-orm";
import { createHash } from "node:crypto";
import { defaultClient as db } from "@repo/database/clients";
import {
  CreateDatasetVariableData,
  DatasetVariableValueLabel,
  dataset,
  datasetVariable,
  insertDatasetVariableSchema,
} from "@repo/database/schema";
import { S3ServiceException } from "@repo/storage";
import { deleteDataset, putDataset } from "@repo/storage";
import { env } from "@/env";
import { ServerActionException, ServerActionValidationException } from "@/lib/exception";
import { type DatasetReadMetadata, datasetReadResponseSchema } from "@/types/dataset";

const ALLOWED_FILE_TYPES = [
  "application/x-spss-sav", // .sav
  // "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  // "text/csv",
  // "application/vnd.oasis.opendocument.spreadsheet", // .ods
  // "application/octet-stream", // .parquet
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export type CreateDatasetResult = {
  success: boolean;
  datasetId?: string;
  key?: string;
  error?: string;
  details?: unknown;
};

export type DatasetFileUpdateVariableSummary = {
  id?: string;
  label?: string | null;
  name: string;
};

export type DatasetFileUpdatePreview = {
  addedVariables: DatasetFileUpdateVariableSummary[];
  deletedVariables: DatasetFileUpdateVariableSummary[];
  file: {
    hash: string;
    name: string;
    size: number;
    variableCount: number;
  };
  unchangedVariables: DatasetFileUpdateVariableSummary[];
};

export type DatasetFileUpdateResult = CreateDatasetResult & {
  preview?: DatasetFileUpdatePreview;
};

type CreateDatasetParams = {
  file: File;
  name: string;
  organizationId: string;
  description?: string;
  contentType: string;
  missingValues: string[] | null;
  userId?: string;
  id?: string; // Optional predefined ID for seeding
};

// Create analysis client without "server-only" import for seeding compatibility
function createAnalysisClientForSeeding() {
  const baseURL = env.ANALYSIS_API_URL;
  const apiKey = env.ANALYSIS_API_KEY;

  return {
    fetch: async (path: string, options?: RequestInit) => {
      const url = `${baseURL}${path}`;
      return fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
          ...options?.headers,
        },
      });
    },
  };
}

function validateDatasetFile(file: File, contentType: string) {
  if (!file) {
    throw new ServerActionValidationException(
      "File is required but was null. This may be due to Next.js server action size limits. Try uploading a smaller file or using a different upload method."
    );
  }

  if (!file.name || typeof file.size !== "number") {
    throw new ServerActionValidationException("Invalid file object. File name or size is missing.");
  }

  if (!ALLOWED_FILE_TYPES.includes(contentType) && !file.name.match(/\.(sav)$/i)) {
    throw new ServerActionValidationException("Invalid file type. Allowed types: .sav");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new ServerActionValidationException(`File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }
}

async function hashFile(file: File) {
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  return createHash("md5").update(fileBuffer).digest("hex");
}

async function fetchDatasetMetadata(datasetId: string) {
  const analysisClient = createAnalysisClientForSeeding();
  const fileMetadataResp = await analysisClient.fetch(`/datasets/${datasetId}/metadata`);
  if (!fileMetadataResp.ok) {
    throw new ServerActionException("Failed to fetch file metadata from analysis service");
  }

  const metadataResult = await fileMetadataResp.json();
  const datasetReadResponse = datasetReadResponseSchema.safeParse(metadataResult);
  if (!datasetReadResponse.success) {
    throw new ServerActionException("Failed to fetch file metadata from analysis service");
  }

  return datasetReadResponse.data.metadata;
}

async function previewUploadedDatasetMetadata(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${env.ANALYSIS_API_URL}/datasets/metadata/preview`, {
    body: formData,
    headers: {
      "X-API-Key": env.ANALYSIS_API_KEY,
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new ServerActionException("Failed to preview file metadata from analysis service");
  }

  const metadataResult = await response.json();
  const datasetReadResponse = datasetReadResponseSchema.safeParse(metadataResult);
  if (!datasetReadResponse.success) {
    throw new ServerActionException("Failed to preview file metadata from analysis service");
  }

  return datasetReadResponse.data.metadata;
}

function buildDatasetVariableInsertValues(
  metadata: DatasetReadMetadata,
  datasetId: string,
  missingValues: string[] | null
) {
  const insertValues: CreateDatasetVariableData[] = [];

  for (const columnName of metadata.column_names) {
    const columnLabel = metadata.column_names_to_labels[columnName] as string;
    const variableValues = metadata.variable_value_labels[columnName] ?? {};

    const columnValueLabels: DatasetVariableValueLabel = {};
    for (const [value, label] of Object.entries(variableValues)) {
      columnValueLabels[value] = label;
    }

    const columnLabels = {
      default: columnLabel,
    };

    const rawMissingRanges = metadata.missing_ranges[columnName];
    const missingRanges = rawMissingRanges ? { [columnName]: rawMissingRanges } : null;

    const insertVariable = insertDatasetVariableSchema.parse({
      name: columnName,
      label: columnLabel ?? columnName,
      measure: metadata.variable_measure[columnName],
      type: metadata.readstat_variable_types[columnName],
      variableLabels: columnLabels,
      valueLabels: columnValueLabels,
      datasetId,
      missingValues: missingValues ?? null,
      missingRanges,
    } as CreateDatasetVariableData);

    insertValues.push(insertVariable);
  }

  return insertValues;
}

async function buildDatasetFileUpdatePreview(
  datasetId: string,
  file: File,
  metadata: DatasetReadMetadata
): Promise<DatasetFileUpdatePreview> {
  const currentVariables = await db
    .select({ id: datasetVariable.id, label: datasetVariable.label, name: datasetVariable.name })
    .from(datasetVariable)
    .where(eq(datasetVariable.datasetId, datasetId));

  const currentByName = new Map(currentVariables.map((variable) => [variable.name, variable]));
  const newNames = new Set(metadata.column_names);

  const addedVariables = metadata.column_names
    .filter((name) => !currentByName.has(name))
    .map((name) => ({ label: metadata.column_names_to_labels[name] ?? name, name }));
  const deletedVariables = currentVariables
    .filter((variable) => !newNames.has(variable.name))
    .map((variable) => ({ id: variable.id, label: variable.label, name: variable.name }));
  const unchangedVariables = metadata.column_names
    .filter((name) => currentByName.has(name))
    .map((name) => {
      const variable = currentByName.get(name);
      return { id: variable?.id, label: variable?.label ?? metadata.column_names_to_labels[name] ?? name, name };
    });

  return {
    addedVariables,
    deletedVariables,
    file: {
      hash: await hashFile(file),
      name: file.name,
      size: file.size,
      variableCount: metadata.column_names.length,
    },
    unchangedVariables,
  };
}

export async function createDataset({
  file,
  name,
  organizationId,
  description,
  contentType,
  missingValues,
  userId,
  id,
}: CreateDatasetParams): Promise<CreateDatasetResult> {
  try {
    validateDatasetFile(file, contentType);

    // Upload file to S3
    const { fileHash, fileExtension, s3Key } = await putDataset(file, contentType, organizationId, userId);

    // Save dataset to database
    const datasetValues = {
      name: name,
      filename: file.name,
      fileType: fileExtension,
      fileSize: file.size,
      fileHash: fileHash,
      storageKey: s3Key,
      organizationId,
      description: description || undefined,
      uploadedAt: new Date(),
      updatedAt: new Date(),
      createdAt: new Date(),
      ...(id && { id }), // Include predefined ID if provided
    };

    const result = await db.insert(dataset).values(datasetValues).returning({ id: dataset.id });

    if (!result[0]?.id) {
      throw new ServerActionException("Failed to save file metadata to database");
    }

    const datasetId = result[0].id;

    const metadata = await fetchDatasetMetadata(datasetId);

    // Create dataset variables
    const insertValues = buildDatasetVariableInsertValues(metadata, datasetId, missingValues);

    await db.insert(datasetVariable).values(insertValues);

    return {
      success: true,
      datasetId: datasetId,
      key: s3Key,
    };
  } catch (error) {
    console.error("Error creating dataset:", error);

    let errorMessage = "Failed to create dataset";
    if (error instanceof S3ServiceException) {
      errorMessage = `S3 Error: ${error.name} - ${error.message}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined,
    };
  }
}

export async function previewDatasetFileUpdate({
  datasetId,
  file,
  contentType,
}: {
  contentType: string;
  datasetId: string;
  file: File;
}): Promise<DatasetFileUpdateResult> {
  try {
    validateDatasetFile(file, contentType);
    const metadata = await previewUploadedDatasetMetadata(file);
    const preview = await buildDatasetFileUpdatePreview(datasetId, file, metadata);

    return {
      success: true,
      preview,
    };
  } catch (error) {
    console.error("Error previewing dataset file update:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to preview dataset file update",
      details: error instanceof Error ? error.stack : undefined,
    };
  }
}

export async function updateDatasetFile({
  datasetId,
  file,
  contentType,
  missingValues,
  userId,
}: {
  contentType: string;
  datasetId: string;
  file: File;
  missingValues: string[] | null;
  userId?: string;
}): Promise<DatasetFileUpdateResult> {
  let newStorageKey: string | null = null;

  try {
    validateDatasetFile(file, contentType);
    const metadata = await previewUploadedDatasetMetadata(file);
    const [currentDataset] = await db.select().from(dataset).where(eq(dataset.id, datasetId)).limit(1);

    if (!currentDataset) {
      throw new ServerActionValidationException("Dataset not found");
    }

    const preview = await buildDatasetFileUpdatePreview(datasetId, file, metadata);
    const { fileHash, fileExtension, s3Key } = await putDataset(
      file,
      contentType,
      currentDataset.organizationId,
      userId
    );
    newStorageKey = s3Key;

    const insertValues = buildDatasetVariableInsertValues(metadata, datasetId, missingValues);
    const insertByName = new Map(insertValues.map((variable) => [variable.name, variable]));
    const currentVariables = await db.select().from(datasetVariable).where(eq(datasetVariable.datasetId, datasetId));
    const currentByName = new Map(currentVariables.map((variable) => [variable.name, variable]));
    const newNames = new Set(metadata.column_names);
    const deletedIds = currentVariables
      .filter((variable) => !newNames.has(variable.name))
      .map((variable) => variable.id);
    const addedVariables = insertValues.filter((variable) => !currentByName.has(variable.name));
    const sharedVariables = currentVariables.filter((variable) => newNames.has(variable.name));

    await db.transaction(async (tx) => {
      await tx
        .update(dataset)
        .set({
          filename: file.name,
          fileHash,
          fileSize: file.size,
          fileType: fileExtension,
          storageKey: s3Key,
          uploadedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(dataset.id, datasetId));

      if (deletedIds.length > 0) {
        await tx
          .delete(datasetVariable)
          .where(and(eq(datasetVariable.datasetId, datasetId), inArray(datasetVariable.id, deletedIds)));
      }

      if (addedVariables.length > 0) {
        await tx.insert(datasetVariable).values(addedVariables);
      }

      for (const variable of sharedVariables) {
        const importedVariable = insertByName.get(variable.name);
        if (!importedVariable) {
          continue;
        }

        await tx
          .update(datasetVariable)
          .set({
            label: importedVariable.label,
            measure: importedVariable.measure,
            type: importedVariable.type,
            valueLabels: importedVariable.valueLabels,
          })
          .where(and(eq(datasetVariable.datasetId, datasetId), eq(datasetVariable.id, variable.id)));
      }
    });

    if (currentDataset.storageKey && currentDataset.storageKey !== s3Key) {
      try {
        await deleteDataset(currentDataset.storageKey);
      } catch (deleteError) {
        console.error("Failed to delete replaced dataset file:", deleteError);
      }
    }

    return {
      success: true,
      datasetId,
      key: s3Key,
      preview,
    };
  } catch (error) {
    console.error("Error updating dataset file:", error);

    if (newStorageKey) {
      try {
        await deleteDataset(newStorageKey);
      } catch (deleteError) {
        console.error("Failed to delete uploaded replacement after update failure:", deleteError);
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update dataset file",
      details: error instanceof Error ? error.stack : undefined,
    };
  }
}
