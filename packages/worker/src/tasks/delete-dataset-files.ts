import type { Task } from "graphile-worker";
import { deleteDataset } from "@repo/storage";

type DatasetRowPayload = {
  created_at: string;
  description: string | null;
  file_hash: string;
  file_size: number;
  file_type: string;
  filename: string;
  id: string;
  name: string;
  organization_id: string;
  storage_key: string;
  updated_at: string | null;
  uploaded_at: string;
};

type DatasetDeleteJobPayload = {
  data: DatasetRowPayload;
  job_id: string;
};

function isDatasetDeleteJobPayload(value: unknown): value is DatasetDeleteJobPayload {
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

  return typeof data.id === "string" && typeof data.storage_key === "string";
}

export const deleteDatasetFiles: Task = async (payload, helpers) => {
  if (!isDatasetDeleteJobPayload(payload)) {
    throw new Error("Invalid delete_dataset_files payload");
  }

  const {
    data: { id: datasetId, storage_key: storageKey },
    job_id,
  } = payload;

  helpers.logger.info(`Deleting dataset file for dataset ${datasetId} (job_id: ${job_id})`);

  try {
    await deleteDataset(storageKey);
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

    helpers.logger.error(`Failed to delete dataset file for dataset ${datasetId} (job_id: ${job_id}): ${lastError}`);

    throw error;
  }
};
