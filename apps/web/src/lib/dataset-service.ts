import { S3ServiceException } from "@aws-sdk/client-s3";
import { defaultClient as db } from "@repo/database/clients";
import {
  CreateDatasetVariableData,
  DatasetVariableValueLabel,
  dataset,
  datasetVariable,
  insertDatasetVariableSchema,
} from "@repo/database/schema";
import {
  ServerActionException,
  ServerActionValidationException,
} from "@/lib/exception";
import { putDataset } from "@/lib/storage";
import { datasetReadResponseSchema } from "@/types/dataset";
import { env } from "@/env";

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
    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(contentType) && !file.name.match(/\.(sav)$/i)) {
      throw new ServerActionValidationException("Invalid file type. Allowed types: .sav");
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new ServerActionValidationException(`File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

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

    const result = await db
      .insert(dataset)
      .values(datasetValues)
      .returning({ id: dataset.id });

    if (!result[0]?.id) {
      throw new ServerActionException("Failed to save file metadata to database");
    }

    const datasetId = result[0].id;

    // Fetch metadata from analysis service
    const analysisClient = createAnalysisClientForSeeding();
    const fileMetadataResp = await analysisClient.fetch(`/datasets/${datasetId}/metadata`);
    if (!fileMetadataResp.ok) {
      throw new ServerActionException("Failed to fetch file metadata from analysis service");
    }
    const metadataResult = await fileMetadataResp.json();
    const datasetReadResponse = datasetReadResponseSchema.safeParse(metadataResult);
    if (!datasetReadResponse.success) {
      console.error(datasetReadResponse.error);
      throw new ServerActionException("Failed to fetch file metadata from analysis service");
    }

    const { metadata } = datasetReadResponse.data;

    // Create dataset variables
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

      // Extract missing ranges for this variable from metadata
      const variableMissingRanges = metadata.missing_ranges[columnName] ?? null;

      const insertVariable = insertDatasetVariableSchema.parse({
        name: columnName,
        label: columnLabel,
        measure: metadata.variable_measure[columnName],
        type: metadata.readstat_variable_types[columnName],
        variableLabels: columnLabels,
        valueLabels: columnValueLabels,
        datasetId: datasetId,
        missingValues: missingValues ?? null,
        missingRanges: variableMissingRanges,
      } as CreateDatasetVariableData);

      insertValues.push(insertVariable);
    }

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