import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { adminApiKeyResult, adminSessionData, createMockAuth, invalidApiKeyResult } from "../../testing/auth";
import { createMockLookupUserDb } from "../../testing/router";
import { resolvePrincipal } from "./principal";

describe("resolvePrincipal", () => {
  test("returns anonymous principal when no auth is provided", async () => {
    const { db } = createMockLookupUserDb(undefined);
    const principal = await resolvePrincipal({
      auth: createMockAuth(),
      db,
      headers: new Headers(),
    });

    assert.equal(principal.kind, "anonymous");
  });

  test("returns session principal when a session is present", async () => {
    const { db } = createMockLookupUserDb(undefined);
    const principal = await resolvePrincipal({
      auth: createMockAuth({ session: adminSessionData }),
      db,
      headers: new Headers(),
    });

    assert.equal(principal.kind, "session");
    if (principal.kind === "session") {
      assert.equal(principal.user.id, adminSessionData.user.id);
    }
  });

  test("returns api-key principal for verified keys owned by an admin user", async () => {
    const { db } = createMockLookupUserDb({
      id: adminSessionData.user.id,
      role: adminSessionData.user.role,
    });
    const principal = await resolvePrincipal({
      auth: createMockAuth({ apiKeyResult: adminApiKeyResult }),
      db,
      headers: new Headers({
        "x-api-key": "uak_valid",
      }),
    });

    assert.equal(principal.kind, "api-key");
    if (principal.kind === "api-key") {
      assert.equal(principal.apiKey.referenceId, adminSessionData.user.id);
      assert.equal(principal.user.role, "admin");
    }
  });

  test("falls back to anonymous principal for invalid API keys", async () => {
    const { db } = createMockLookupUserDb(undefined);
    const principal = await resolvePrincipal({
      auth: createMockAuth({ apiKeyResult: invalidApiKeyResult }),
      db,
      headers: new Headers({
        "x-api-key": "uak_invalid",
      }),
    });

    assert.equal(principal.kind, "anonymous");
  });
});
