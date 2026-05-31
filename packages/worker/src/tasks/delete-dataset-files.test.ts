import type { Task } from "graphile-worker";
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createDeleteDatasetFilesTask } from "./delete-dataset-files.js";

type DatasetDeleteJobPayload = {
  data: {
    id: string;
    storage_key: string;
  };
  job_id: string;
};

type QueryCall = {
  params: unknown[];
  text: string;
};

type MockPgClient = {
  query: (text: string, params: unknown[]) => Promise<void>;
};

type TaskHelpers = Parameters<Task>[1];

function createPayload(jobId = "550e8400-e29b-41d4-a716-446655440100"): DatasetDeleteJobPayload {
  return {
    data: {
      id: "550e8400-e29b-41d4-a716-446655440000",
      storage_key: "uploads/example.csv",
    },
    job_id: jobId,
  };
}

function createHelpers() {
  const errorLogs: string[] = [];
  const infoLogs: string[] = [];
  const queries: QueryCall[] = [];

  const client: MockPgClient = {
    async query(text, params) {
      queries.push({ params, text });
    },
  };

  const helpers = {
    logger: {
      error(message: string) {
        errorLogs.push(message);
      },
      info(message: string) {
        infoLogs.push(message);
      },
    },
    async withPgClient<T>(callback: (pgClient: MockPgClient) => Promise<T>) {
      return callback(client);
    },
  } as TaskHelpers;

  return { errorLogs, helpers, infoLogs, queries };
}

describe("createDeleteDatasetFilesTask", () => {
  test("deletes the dataset object and completes the job", async () => {
    const deletedKeys: string[] = [];
    const task = createDeleteDatasetFilesTask(async (storageKey: string) => {
      deletedKeys.push(storageKey);
    });
    const payload = createPayload();
    const { errorLogs, helpers, infoLogs, queries } = createHelpers();

    await task(payload, helpers);

    assert.deepEqual(deletedKeys, [payload.data.storage_key]);
    assert.deepEqual(queries, [
      {
        params: [payload.job_id],
        text: "UPDATE public.jobs SET status = 'completed'::job_status, last_error = NULL WHERE id = $1",
      },
    ]);
    assert.deepEqual(errorLogs, []);
    assert.deepEqual(infoLogs, [`Deleting dataset file for dataset ${payload.data.id} (job_id: ${payload.job_id})`]);
  });

  test("rejects invalid payloads before touching storage", async () => {
    const task = createDeleteDatasetFilesTask(async () => {
      throw new Error("should not be called");
    });
    const { errorLogs, helpers, infoLogs, queries } = createHelpers();

    await assert.rejects(async () => {
      await task(
        { data: { id: "550e8400-e29b-41d4-a716-446655440000" } } as unknown as DatasetDeleteJobPayload,
        helpers
      );
    }, /Invalid delete_dataset_files payload/);

    assert.deepEqual(queries, []);
    assert.deepEqual(infoLogs, []);
    assert.deepEqual(errorLogs, []);
  });

  test("stores the last error and rethrows storage failures", async () => {
    const failure = new Error("boom");
    const task = createDeleteDatasetFilesTask(async () => {
      throw failure;
    });
    const payload = createPayload("550e8400-e29b-41d4-a716-446655440101");
    const { errorLogs, helpers, infoLogs, queries } = createHelpers();

    await assert.rejects(async () => {
      await task(payload, helpers);
    }, failure);

    assert.deepEqual(queries, [
      {
        params: [payload.job_id, "boom"],
        text: "UPDATE public.jobs SET last_error = $2 WHERE id = $1",
      },
    ]);
    assert.deepEqual(infoLogs, [`Deleting dataset file for dataset ${payload.data.id} (job_id: ${payload.job_id})`]);
    assert.deepEqual(errorLogs, [
      `Failed to delete dataset file for dataset ${payload.data.id} (job_id: ${payload.job_id}): boom`,
    ]);
  });
});
