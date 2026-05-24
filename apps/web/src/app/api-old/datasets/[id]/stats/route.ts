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
    const analysisResp = await analysisClient.fetch(`/datasets/${id}/stats`, {
      method: "POST",
      body,
    });

    const analysisResult = await analysisResp.json();

    return NextResponse.json(analysisResult);
  } catch (error: unknown) {
    return raiseExceptionResponse(error);
  }
}
