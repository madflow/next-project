import { NextResponse } from "next/server";
import { assertAccess } from "@/dal/dataset";
import { listByDataset } from "@/dal/dataset-project";
import { raiseExceptionResponse } from "@/lib/exception";
import { processUrlParams } from "../../../handler";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  try {
    await assertAccess(id);
    const { limit, offset, orderBy } = processUrlParams(new URL(request.url).searchParams);

    const result = await listByDataset({
      filters: [
        {
          column: "datasetId",
          value: id,
          operator: "=",
        },
      ],
      limit,
      offset,
      orderBy,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    return raiseExceptionResponse(error);
  }
}
