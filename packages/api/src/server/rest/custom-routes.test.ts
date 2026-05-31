import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { DatabaseInstance } from "@repo/database/clients";
import { adminSessionData, createMockAuth, userSessionData } from "../../testing/auth";
import { createCustomRouteHandler } from "./custom-routes";

const datasetId = "550e8400-e29b-41d4-a716-446655440000";
const fileId = "550e8400-e29b-41d4-a716-446655440050";
const organizationId = "550e8400-e29b-41d4-a716-446655440999";

type MetadataFileRow = {
  datasetId: string;
  id: string;
  storageKey: string;
  uploadedBy: string | null;
};

function createMetadataDeleteDb(file: MetadataFileRow | null) {
  const state = {
    deleteCalls: 0,
  };

  const db = {
    delete() {
      return {
        async where() {
          state.deleteCalls += 1;
        },
      };
    },
    async execute() {
      return {
        rows: [{ exists: true }],
      };
    },
    select(selection?: unknown) {
      if (selection && typeof selection === "object" && "organizationId" in selection) {
        return {
          from() {
            return this;
          },
          where() {
            return this;
          },
          async execute() {
            return [{ organizationId }];
          },
        };
      }

      return {
        from() {
          return this;
        },
        where() {
          return this;
        },
        async limit() {
          return file === null ? [] : [file];
        },
      };
    },
  };

  return { db: db as unknown as DatabaseInstance, state };
}

function createMetadataUploadDb() {
  const state = {
    datasetLookupCount: 0,
  };

  const db = {
    async execute() {
      return {
        rows: [{ exists: true }],
      };
    },
    select(selection?: unknown) {
      if (selection && typeof selection === "object" && "organizationId" in selection) {
        return {
          from() {
            return this;
          },
          where() {
            return this;
          },
          async execute() {
            return [{ organizationId }];
          },
        };
      }

      return {
        from() {
          return this;
        },
        where() {
          return this;
        },
        async limit() {
          state.datasetLookupCount += 1;
          return [{ id: datasetId, organizationId }];
        },
      };
    },
  };

  return { db: db as unknown as DatabaseInstance, state };
}

describe("createCustomRouteHandler", () => {
  test("allows admins to reach metadata upload validation", async () => {
    const { db, state } = createMetadataUploadDb();
    const formData = new FormData();
    formData.set("name", "Questionnaire");
    const handler = createCustomRouteHandler({
      auth: createMockAuth({ session: adminSessionData }),
      db,
      pathPrefix: "/rpc",
    });

    const response = await handler(
      new Request(`http://localhost/rpc/datasets/${datasetId}/metadata-files`, { method: "POST", body: formData })
    );

    assert.ok(response);
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "No file provided" });
    assert.equal(state.datasetLookupCount, 1);
  });

  test("returns 403 when a non-admin tries to upload a metadata file", async () => {
    const { db, state } = createMetadataUploadDb();
    const formData = new FormData();
    formData.set("name", "Questionnaire");
    const handler = createCustomRouteHandler({
      auth: createMockAuth({ session: userSessionData }),
      db,
      pathPrefix: "/rpc",
    });

    const response = await handler(
      new Request(`http://localhost/rpc/datasets/${datasetId}/metadata-files`, { method: "POST", body: formData })
    );

    assert.ok(response);
    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), {
      error: "You do not have enough permission to perform this action.",
    });
    assert.equal(state.datasetLookupCount, 0);
  });

  test("deletes metadata file rows for the original uploader", async () => {
    const { db, state } = createMetadataDeleteDb({
      datasetId,
      id: fileId,
      storageKey: "datasets/example/metadata/file.pdf",
      uploadedBy: userSessionData.user.id,
    });
    const handler = createCustomRouteHandler({
      auth: createMockAuth({ session: userSessionData }),
      db,
      pathPrefix: "/rpc",
    });

    const response = await handler(
      new Request(`http://localhost/rpc/datasets/${datasetId}/metadata-files/${fileId}`, { method: "DELETE" })
    );

    assert.ok(response);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { success: true });
    assert.equal(state.deleteCalls, 1);
  });

  test("returns 403 when a non-admin tries to delete another user's metadata file", async () => {
    const { db, state } = createMetadataDeleteDb({
      datasetId,
      id: fileId,
      storageKey: "datasets/example/metadata/file.pdf",
      uploadedBy: adminSessionData.user.id,
    });
    const handler = createCustomRouteHandler({
      auth: createMockAuth({ session: userSessionData }),
      db,
      pathPrefix: "/rpc",
    });

    const response = await handler(
      new Request(`http://localhost/rpc/datasets/${datasetId}/metadata-files/${fileId}`, { method: "DELETE" })
    );

    assert.ok(response);
    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), {
      error: "You can only delete files you uploaded",
    });
    assert.equal(state.deleteCalls, 0);
  });

  test("returns 403 when a non-admin tries to delete an orphaned metadata file", async () => {
    const { db, state } = createMetadataDeleteDb({
      datasetId,
      id: fileId,
      storageKey: "datasets/example/metadata/file.pdf",
      uploadedBy: null,
    });
    const handler = createCustomRouteHandler({
      auth: createMockAuth({ session: userSessionData }),
      db,
      pathPrefix: "/rpc",
    });

    const response = await handler(
      new Request(`http://localhost/rpc/datasets/${datasetId}/metadata-files/${fileId}`, { method: "DELETE" })
    );

    assert.ok(response);
    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), {
      error: "Only admins can delete orphaned files",
    });
    assert.equal(state.deleteCalls, 0);
  });
});
