import { NextResponse } from "next/server";
import { assertAccess } from "@/dal/dataset";
import { listByDataset } from "@/dal/dataset-splitvariable";
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

    const url = new URL(request.url);
    const { limit, offset, search, orderBy, filters } = processUrlParams(url.searchParams);

    const result = await listByDataset(id, {
      filters,
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
