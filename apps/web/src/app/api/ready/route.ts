import { sql } from "drizzle-orm";
import { defaultClient as db } from "@repo/database/clients";

const READINESS_TIMEOUT_MS = 1500;

function createTimeoutError(timeoutMs: number) {
  return new Error(`Readiness DB check timed out after ${timeoutMs}ms`);
}

async function runReadinessDatabaseCheck() {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    await Promise.race([
      db.execute(sql`SELECT 1`),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(createTimeoutError(READINESS_TIMEOUT_MS));
        }, READINESS_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export async function GET() {
  try {
    await runReadinessDatabaseCheck();

    return Response.json(
      {
        status: "ready",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Readiness check: Database connectivity failed", {
      error: error instanceof Error ? error.message : String(error),
      code: typeof error === "object" && error !== null && "code" in error ? error.code : undefined,
      timestamp: new Date().toISOString(),
    });

    return Response.json(
      {
        status: "not_ready",
      },
      { status: 503 }
    );
  }
}
