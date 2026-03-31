import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { getAppHealth, toPublicAppHealth } from "./health";

describe("app health", () => {
  test("returns healthy status with per-service diagnostics", async () => {
    const result = await getAppHealth({
      runDatabaseCheck: async () => {},
      runS3Check: async () => {},
      runAnalysisCheck: async () => ({ statusCode: 200, healthStatus: "healthy" }),
      now: () => "2026-03-31T12:00:00.000Z",
    });

    assert.equal(result.status, "healthy");
    assert.equal(result.httpStatus, 200);
    assert.deepEqual(result.checks, {
      database: true,
      s3: true,
      analysisService: true,
    });
    assert.equal(result.services.analysisService.statusCode, 200);
    assert.equal(result.timestamp, "2026-03-31T12:00:00.000Z");
  });

  test("returns degraded status when any dependency fails", async () => {
    const result = await getAppHealth({
      runDatabaseCheck: async () => {
        throw new Error("database unavailable");
      },
      runS3Check: async () => {},
      runAnalysisCheck: async () => ({ statusCode: 503, healthStatus: "unhealthy" }),
      now: () => "2026-03-31T12:00:00.000Z",
    });

    assert.equal(result.status, "degraded");
    assert.equal(result.httpStatus, 503);
    assert.deepEqual(result.checks, {
      database: false,
      s3: true,
      analysisService: false,
    });
    assert.match(result.services.database.error ?? "", /database unavailable/);
    assert.equal(result.services.analysisService.statusCode, 503);
  });

  test("database timeout is reported as a failed dependency", async () => {
    const result = await getAppHealth({
      runDatabaseCheck: async () => {
        throw new Error("Database health check timed out after 2000ms");
      },
      runS3Check: async () => {},
      runAnalysisCheck: async () => ({ statusCode: 200, healthStatus: "healthy" }),
      now: () => "2026-03-31T12:00:00.000Z",
    });

    assert.equal(result.checks.database, false);
    assert.match(result.services.database.error ?? "", /timed out after 2000ms/);
  });

  test("analysis body status must be healthy to pass the dependency check", async () => {
    const result = await getAppHealth({
      runDatabaseCheck: async () => {},
      runS3Check: async () => {},
      runAnalysisCheck: async () => ({ statusCode: 200, healthStatus: "unhealthy" }),
      now: () => "2026-03-31T12:00:00.000Z",
    });

    assert.equal(result.checks.analysisService, false);
    assert.equal(result.httpStatus, 503);
    assert.match(result.services.analysisService.error ?? "", /reported status unhealthy/);
  });

  test("public health payload omits internal diagnostic details", async () => {
    const result = await getAppHealth({
      runDatabaseCheck: async () => {
        throw new Error("database unavailable");
      },
      runS3Check: async () => {},
      runAnalysisCheck: async () => ({ statusCode: 503, healthStatus: "unhealthy" }),
      now: () => "2026-03-31T12:00:00.000Z",
    });

    const publicResult = toPublicAppHealth(result);

    assert.equal(publicResult.services.database.connected, false);
    assert.equal(publicResult.services.database.durationMs >= 0, true);
    assert.equal("error" in publicResult.services.database, false);
    assert.equal("statusCode" in publicResult.services.analysisService, false);
  });
});
