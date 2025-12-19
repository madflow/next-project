import { sql } from "drizzle-orm";
import { defaultClient as db } from "@repo/database/clients";
import { env } from "@/env";
import { testS3BucketAccess } from "@/lib/storage";

export async function GET() {
  const checks = {
    database: false,
    s3: false,
    analysisService: false,
  };

  // Check database connectivity
  try {
    await db.execute(sql`SELECT 1`);
    checks.database = true;
  } catch (error) {
    console.error("Health check: Database connectivity failed", {
      error: error instanceof Error ? error.message : String(error),
      details: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
  }

  // Check S3 connectivity
  try {
    await testS3BucketAccess();
    checks.s3 = true;
  } catch (error) {
    console.error("Health check: S3 connectivity failed", {
      error: error instanceof Error ? error.message : String(error),
      details: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
  }

  // Check analysis service connectivity
  try {
    const analysisHealthUrl = `${env.ANALYSIS_API_URL}/health`;
    const response = await fetch(analysisHealthUrl, {
      method: "GET",
      headers: {
        "X-API-KEY": env.ANALYSIS_API_KEY,
      },
      // Add a timeout to prevent hanging
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      checks.analysisService = true;
    } else {
      throw new Error(`Analysis service returned status ${response.status}`);
    }
  } catch (error) {
    console.error("Health check: Analysis service connectivity failed", {
      error: error instanceof Error ? error.message : String(error),
      details: error instanceof Error ? error.stack : undefined,
      analysisServiceUrl: env.ANALYSIS_API_URL,
      timestamp: new Date().toISOString(),
    });
  }

  // Determine overall health status
  const allHealthy = Object.values(checks).every((check) => check === true);
  const status = allHealthy ? 200 : 503;

  return Response.json(
    {
      status: allHealthy ? "healthy" : "degraded",
      checks,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}
