import type { Task } from "graphile-worker";
import { deleteStorageObject } from "@repo/storage";

type DatasetMetadataFileRowPayload = {
  created_at: string;
  dataset_id: string;
  description: string | null;
  file_hash: string;
  file_size: number;
  file_type: string;
  id: string;
  metadata_type: string;
  name: string;
  organization_id: string;
  s3_key: string;
  updated_at: string | null;
  uploaded_at: string;
  uploaded_by: string;
};

type DatasetMetadataFileDeleteJobPayload = {
  data: DatasetMetadataFileRowPayload;
  job_id: string;
};

function isDatasetMetadataFileDeleteJobPayload(value: unknown): value is DatasetMetadataFileDeleteJobPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as Record<string, unknown>;

  if (typeof payload.job_id !== "string") {
    return false;
  }

  if (typeof payload.data !== "object" || payload.data === null) {
    return false;
  }

  const data = payload.data as Record<string, unknown>;

  return typeof data.dataset_id === "string" && typeof data.id === "string" && typeof data.s3_key === "string";
}

export function createDeleteDatasetMetadataFilesTask(
  deleteMetadataObject: typeof deleteStorageObject = deleteStorageObject
): Task {
  return async (payload, helpers) => {
    if (!isDatasetMetadataFileDeleteJobPayload(payload)) {
      throw new Error("Invalid delete_dataset_metadata_files payload");
    }

    const {
      data: { dataset_id: datasetId, id: metadataFileId, s3_key: storageKey },
      job_id,
    } = payload;

    helpers.logger.info(`Deleting metadata file ${metadataFileId} for dataset ${datasetId} (job_id: ${job_id})`);

    try {
      await deleteMetadataObject(storageKey);
      await helpers.withPgClient(async (client) => {
        await client.query("UPDATE public.jobs SET status = 'completed'::job_status, last_error = NULL WHERE id = $1", [
          job_id,
        ]);
      });
    } catch (error) {
      const lastError = error instanceof Error ? error.message : "Unknown error";

      await helpers.withPgClient(async (client) => {
        await client.query("UPDATE public.jobs SET last_error = $2 WHERE id = $1", [job_id, lastError]);
      });

      helpers.logger.error(
        `Failed to delete metadata file ${metadataFileId} for dataset ${datasetId} (job_id: ${job_id}): ${lastError}`
      );

      throw error;
    }
  };
}

export const deleteDatasetMetadataFiles = createDeleteDatasetMetadataFilesTask();
