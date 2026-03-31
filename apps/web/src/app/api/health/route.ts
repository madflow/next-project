import { getAppHealth, logFailedAppHealthChecks, toPublicAppHealth } from "@/lib/health";

export async function GET() {
  const health = await getAppHealth();
  logFailedAppHealthChecks(health);

  const body = toPublicAppHealth(health);

  return Response.json(body, {
    status: health.httpStatus,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
