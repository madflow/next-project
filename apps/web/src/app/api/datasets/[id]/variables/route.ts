import { NextResponse } from "next/server";
import { listByDataset } from "@/dal/dataset-variable";
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
    const { limit, offset, search, orderBy } = processUrlParams(new URL(request.url).searchParams);

    const result = await listByDataset(id, {
      limit,
      offset,
      search,
      searchColumns: ["name", "label"],
      orderBy,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    return raiseExceptionResponse(error);
  }
}
