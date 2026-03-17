import { NextResponse } from "next/server";
import { assertAccess } from "@/dal/dataset";
import { createAnalysisClient } from "@/lib/analysis-client";
import { raiseExceptionResponse } from "@/lib/exception";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await assertAccess(id);

    const body = await request.text();

    const analysisClient = createAnalysisClient();
    const analysisResp = await analysisClient.fetch(`/datasets/${id}/exports/excel`, {
      method: "POST",
      body,
    });

    if (!analysisResp.ok) {
      const contentType = analysisResp.headers.get("Content-Type") ?? "application/json";

      if (contentType.includes("application/json")) {
        const errorPayload = await analysisResp.json();
        return NextResponse.json(errorPayload, { status: analysisResp.status });
      }

      const errorText = await analysisResp.text();
      return NextResponse.json({ error: errorText || "Excel export failed" }, { status: analysisResp.status });
    }

    const buffer = await analysisResp.arrayBuffer();

    return new NextResponse(buffer, {
      status: analysisResp.status,
      headers: {
        "Content-Type":
          analysisResp.headers.get("Content-Type") ??
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          analysisResp.headers.get("Content-Disposition") ?? 'attachment; filename="chart-export.xlsx"',
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  } catch (error: unknown) {
    return raiseExceptionResponse(error);
  }
}
