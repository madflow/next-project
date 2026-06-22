import { and, eq, inArray, sql } from "drizzle-orm";
import { createHash } from "node:crypto";
import { defaultClient as db } from "@repo/database/clients";
import {
  CreateDatasetVariableData,
  DatasetVariableValueLabel,
  dataset,
  datasetVariable,
  insertDatasetVariableSchema,
  job,
} from "@repo/database/schema";
import { S3ServiceException } from "@repo/storage";
import { deleteDataset, putDataset } from "@repo/storage";
import { env } from "@/env";
import {
  type DatasetFileUpdateVariableChange,
  getVariableChanges,
  hashDatasetState,
} from "@/lib/dataset-file-update-helpers";
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
  changes?: DatasetFileUpdateVariableChange[];
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
  matchedVariables: DatasetFileUpdateVariableSummary[];
  stateHash: string;
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
  const hash = createHash("md5");
  const reader = file.stream().getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    hash.update(value);
  }

  return hash.digest("hex");
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
    const columnLabel = metadata.column_names_to_labels[columnName] ?? columnName;
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
      label: columnLabel,
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

type DatasetState = typeof dataset.$inferSelect;
type DatasetVariableState = typeof datasetVariable.$inferSelect;

function buildDatasetFileUpdatePreview(
  file: File,
  fileHash: string,
  metadata: DatasetReadMetadata,
  currentDataset: DatasetState,
  currentVariables: DatasetVariableState[]
): DatasetFileUpdatePreview {
  const importedVariables = buildDatasetVariableInsertValues(metadata, currentDataset.id, null);
  const importedByName = new Map(importedVariables.map((variable) => [variable.name, variable]));

  const currentByName = new Map(currentVariables.map((variable) => [variable.name, variable]));
  const newNames = new Set(metadata.column_names);

  const addedVariables = metadata.column_names
    .filter((name) => !currentByName.has(name))
    .map((name) => ({ label: metadata.column_names_to_labels[name] ?? name, name }));
  const deletedVariables = currentVariables
    .filter((variable) => !newNames.has(variable.name))
    .map((variable) => ({ id: variable.id, label: variable.label, name: variable.name }));
  const matchedVariables = metadata.column_names
    .filter((name) => currentByName.has(name))
    .map((name) => {
      const variable = currentByName.get(name);
      const importedVariable = importedByName.get(name);
      return {
        changes: variable && importedVariable ? getVariableChanges(variable, importedVariable) : [],
        id: variable?.id,
        label: metadata.column_names_to_labels[name] ?? name,
        name,
      };
    });

  return {
    addedVariables,
    deletedVariables,
    file: {
      hash: fileHash,
      name: file.name,
      size: file.size,
      variableCount: metadata.column_names.length,
    },
    matchedVariables,
    stateHash: hashDatasetState(currentDataset, currentVariables),
  };
}

function isPostgresSerializationFailure(error: unknown) {
  let current = error;
  const seen = new Set<unknown>();

  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    if ("code" in current && current.code === "40001") {
      return true;
    }
    current = "cause" in current ? current.cause : undefined;
  }

  return false;
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
    const [currentDataset] = await db.select().from(dataset).where(eq(dataset.id, datasetId)).limit(1);
    if (!currentDataset) {
      throw new ServerActionValidationException("Dataset not found");
    }

    const currentVariables = await db.select().from(datasetVariable).where(eq(datasetVariable.datasetId, datasetId));
    const metadata = await previewUploadedDatasetMetadata(file);
    const fileHash = await hashFile(file);
    const preview = buildDatasetFileUpdatePreview(file, fileHash, metadata, currentDataset, currentVariables);

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
  expectedFileHash,
  expectedStateHash,
  missingValues,
  userId,
}: {
  contentType: string;
  datasetId: string;
  expectedFileHash: string;
  expectedStateHash: string;
  file: File;
  missingValues: string[] | null;
  userId?: string;
}): Promise<DatasetFileUpdateResult> {
  let newStorageKey: string | null = null;
  let committedPreview: DatasetFileUpdatePreview | null = null;

  try {
    validateDatasetFile(file, contentType);
    const metadata = await previewUploadedDatasetMetadata(file);
    const actualFileHash = await hashFile(file);
    if (actualFileHash !== expectedFileHash) {
      throw new ServerActionValidationException("The replacement file changed after preview. Preview it again.");
    }

    const [currentDataset] = await db.select().from(dataset).where(eq(dataset.id, datasetId)).limit(1);

    if (!currentDataset) {
      throw new ServerActionValidationException("Dataset not found");
    }

    const currentVariables = await db.select().from(datasetVariable).where(eq(datasetVariable.datasetId, datasetId));
    if (hashDatasetState(currentDataset, currentVariables) !== expectedStateHash) {
      throw new ServerActionValidationException("The dataset changed after preview. Preview the replacement again.");
    }

    const { fileHash, fileExtension, s3Key } = await putDataset(
      file,
      contentType,
      currentDataset.organizationId,
      userId
    );
    newStorageKey = s3Key;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        committedPreview = await db.transaction(
          async (tx) => {
            await tx.execute(sql`SELECT ${dataset.id} FROM ${dataset} WHERE ${dataset.id} = ${datasetId} FOR UPDATE`);
            await tx.execute(
              sql`SELECT ${datasetVariable.id} FROM ${datasetVariable} WHERE ${datasetVariable.datasetId} = ${datasetId} FOR UPDATE`
            );

            const [lockedDataset] = await tx.select().from(dataset).where(eq(dataset.id, datasetId)).limit(1);
            if (!lockedDataset) {
              throw new ServerActionValidationException("Dataset not found");
            }

            const lockedVariables = await tx
              .select()
              .from(datasetVariable)
              .where(eq(datasetVariable.datasetId, datasetId));
            if (hashDatasetState(lockedDataset, lockedVariables) !== expectedStateHash) {
              throw new ServerActionValidationException(
                "The dataset changed after preview. Preview the replacement again."
              );
            }

            const preview = buildDatasetFileUpdatePreview(
              file,
              actualFileHash,
              metadata,
              lockedDataset,
              lockedVariables
            );
            const insertValues = buildDatasetVariableInsertValues(metadata, datasetId, missingValues);
            const insertByName = new Map(insertValues.map((variable) => [variable.name, variable]));
            const currentByName = new Map(lockedVariables.map((variable) => [variable.name, variable]));
            const newNames = new Set(metadata.column_names);
            const deletedIds = lockedVariables
              .filter((variable) => !newNames.has(variable.name))
              .map((variable) => variable.id);
            const addedVariables = insertValues.filter((variable) => !currentByName.has(variable.name));
            const sharedVariables = lockedVariables.filter((variable) => newNames.has(variable.name));

            const updatedDatasets = await tx
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
              .where(eq(dataset.id, datasetId))
              .returning({ id: dataset.id });

            if (!updatedDatasets[0]) {
              throw new ServerActionValidationException("Dataset not found");
            }

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

              const currentLabels =
                variable.variableLabels && typeof variable.variableLabels === "object"
                  ? (variable.variableLabels as Record<string, string>)
                  : {};

              await tx
                .update(datasetVariable)
                .set({
                  label: importedVariable.label,
                  measure: importedVariable.measure,
                  type: importedVariable.type,
                  valueLabels: importedVariable.valueLabels,
                  variableLabels: {
                    ...currentLabels,
                    default: importedVariable.label ?? variable.name,
                  },
                })
                .where(and(eq(datasetVariable.datasetId, datasetId), eq(datasetVariable.id, variable.id)));
            }

            if (lockedDataset.storageKey && lockedDataset.storageKey !== s3Key) {
              await tx.insert(job).values({
                payload: {
                  id: datasetId,
                  storage_key: lockedDataset.storageKey,
                },
                queueName: "default",
                runAt: new Date(Date.now() + 5 * 60 * 1000),
                taskIdentifier: "delete_dataset_files",
              });
            }

            return preview;
          },
          { isolationLevel: "serializable" }
        );
        break;
      } catch (error) {
        if (attempt === 2 || !isPostgresSerializationFailure(error)) {
          throw error;
        }
      }
    }

    if (!committedPreview) {
      throw new ServerActionException("Failed to replace dataset file");
    }

    return {
      success: true,
      datasetId,
      key: s3Key,
      preview: committedPreview,
    };
  } catch (error) {
    console.error("Error updating dataset file:", error);

    if (newStorageKey) {
      try {
        const [persistedDataset] = await db
          .select({ storageKey: dataset.storageKey })
          .from(dataset)
          .where(eq(dataset.id, datasetId))
          .limit(1);

        if (persistedDataset?.storageKey === newStorageKey) {
          return {
            success: true,
            datasetId,
            key: newStorageKey,
            preview: committedPreview ?? undefined,
          };
        }

        await deleteDataset(newStorageKey);
      } catch (cleanupError) {
        // A leaked object is safer than deleting a replacement that may have committed.
        console.error("Failed to verify or delete uploaded replacement after update failure:", cleanupError);
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update dataset file",
    };
  }
}
