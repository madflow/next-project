import { NextResponse } from "next/server";
import { find } from "@/dal/dataset";
import { createAnalysisClient } from "@/lib/analysis-client";
import { raiseExceptionResponse } from "@/lib/exception";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  await find(id);

  const body = await request.text();

  const analysisClient = createAnalysisClient();
  const analysisResp = await analysisClient.fetch(`/datasets/${id}/stats`, {
    method: "POST",
    body,
  });

  const analysisResult = await analysisResp.json();

  try {
    return NextResponse.json(analysisResult);
  } catch (error: unknown) {
    return raiseExceptionResponse(error);
  }
}
