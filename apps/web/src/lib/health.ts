import { sql } from "drizzle-orm";
import { defaultClient as db } from "@repo/database/clients";
import { env } from "@/env";
import { testS3BucketAccess } from "@/lib/storage";

const ANALYSIS_SERVICE_TIMEOUT_MS = 3000;
const DATABASE_TIMEOUT_MS = 2000;
const S3_TIMEOUT_MS = 2000;

type HealthServiceName = "database" | "s3" | "analysisService";

export type HealthServiceResult = {
  connected: boolean;
  durationMs: number;
  error?: string;
  statusCode?: number;
};

export type PublicHealthServiceResult = {
  connected: boolean;
  durationMs: number;
};

export type AppHealthResult = {
  status: "healthy" | "degraded";
  checks: Record<HealthServiceName, boolean>;
  services: Record<HealthServiceName, HealthServiceResult>;
  timestamp: string;
  durationMs: number;
  httpStatus: 200 | 503;
};

export type PublicAppHealthResult = Omit<AppHealthResult, "httpStatus" | "services"> & {
  services: Record<HealthServiceName, PublicHealthServiceResult>;
};

export type AppHealthDependencies = {
  runDatabaseCheck?: () => Promise<void>;
  runS3Check?: (timeoutMs: number) => Promise<void>;
  runAnalysisCheck?: (timeoutMs: number) => Promise<{ statusCode: number; healthStatus?: string }>;
  now?: () => string;
};

function getHealthStatus(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function getDurationMs(startedAt: number) {
  return Date.now() - startedAt;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function createTimeoutTask(timeoutMs: number, label: string) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return {
    promise: new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`${label} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    }),
    clear: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    },
  };
}

async function checkDatabase(runDatabaseCheck: () => Promise<void>): Promise<HealthServiceResult> {
  const startedAt = Date.now();

  try {
    await runDatabaseCheck();

    return {
      connected: true,
      durationMs: getDurationMs(startedAt),
    };
  } catch (error) {
    return {
      connected: false,
      durationMs: getDurationMs(startedAt),
      error: getErrorMessage(error),
    };
  }
}

async function checkS3(runS3Check: (timeoutMs: number) => Promise<void>): Promise<HealthServiceResult> {
  const startedAt = Date.now();

  try {
    await runS3Check(S3_TIMEOUT_MS);

    return {
      connected: true,
      durationMs: getDurationMs(startedAt),
    };
  } catch (error) {
    return {
      connected: false,
      durationMs: getDurationMs(startedAt),
      error: getErrorMessage(error),
    };
  }
}

async function checkAnalysisService(
  runAnalysisCheck: (timeoutMs: number) => Promise<{ statusCode: number; healthStatus?: string }>
): Promise<HealthServiceResult> {
  const startedAt = Date.now();

  try {
    const { statusCode, healthStatus } = await runAnalysisCheck(ANALYSIS_SERVICE_TIMEOUT_MS);

    if (statusCode < 200 || statusCode >= 300) {
      return {
        connected: false,
        durationMs: getDurationMs(startedAt),
        error: `Analysis service returned status ${statusCode}`,
        statusCode,
      };
    }

    if (healthStatus !== undefined && healthStatus !== "healthy") {
      return {
        connected: false,
        durationMs: getDurationMs(startedAt),
        error: `Analysis service reported status ${healthStatus}`,
        statusCode,
      };
    }

    return {
      connected: true,
      durationMs: getDurationMs(startedAt),
      statusCode,
    };
  } catch (error) {
    return {
      connected: false,
      durationMs: getDurationMs(startedAt),
      error: getErrorMessage(error),
    };
  }
}

async function defaultRunDatabaseCheck() {
  const timeout = createTimeoutTask(DATABASE_TIMEOUT_MS, "Database health check");

  try {
    await Promise.race([db.execute(sql`SELECT 1`), timeout.promise]);
  } finally {
    timeout.clear();
  }
}

async function defaultRunS3Check(timeoutMs: number) {
  await testS3BucketAccess({ timeoutMs });
}

async function defaultRunAnalysisCheck(timeoutMs: number) {
  const response = await fetch(`${env.ANALYSIS_API_URL}/health`, {
    method: "GET",
    headers: {
      "X-API-KEY": env.ANALYSIS_API_KEY,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });

  let healthStatus: string | undefined;

  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "status" in body) {
      healthStatus = getHealthStatus(body.status);
    }
  } catch {
    healthStatus = undefined;
  }

  return {
    statusCode: response.status,
    healthStatus,
  };
}

export async function getAppHealth(dependencies: AppHealthDependencies = {}): Promise<AppHealthResult> {
  const {
    runDatabaseCheck = defaultRunDatabaseCheck,
    runS3Check = defaultRunS3Check,
    runAnalysisCheck = defaultRunAnalysisCheck,
    now = () => new Date().toISOString(),
  } = dependencies;

  const startedAt = Date.now();
  const [database, s3, analysisService] = await Promise.all([
    checkDatabase(runDatabaseCheck),
    checkS3(runS3Check),
    checkAnalysisService(runAnalysisCheck),
  ]);

  const services = {
    database,
    s3,
    analysisService,
  };

  const checks = {
    database: database.connected,
    s3: s3.connected,
    analysisService: analysisService.connected,
  };

  const allHealthy = Object.values(checks).every(Boolean);

  return {
    status: allHealthy ? "healthy" : "degraded",
    checks,
    services,
    timestamp: now(),
    durationMs: getDurationMs(startedAt),
    httpStatus: allHealthy ? 200 : 503,
  };
}

export function logFailedAppHealthChecks(result: AppHealthResult) {
  for (const [serviceName, service] of Object.entries(result.services)) {
    if (service.connected) {
      continue;
    }

    console.error("Health check failed", {
      service: serviceName,
      ...service,
      timestamp: result.timestamp,
    });
  }
}

export function toPublicAppHealth(result: AppHealthResult): PublicAppHealthResult {
  return {
    status: result.status,
    checks: result.checks,
    services: {
      database: {
        connected: result.services.database.connected,
        durationMs: result.services.database.durationMs,
      },
      s3: {
        connected: result.services.s3.connected,
        durationMs: result.services.s3.durationMs,
      },
      analysisService: {
        connected: result.services.analysisService.connected,
        durationMs: result.services.analysisService.durationMs,
      },
    },
    timestamp: result.timestamp,
    durationMs: result.durationMs,
  };
}
