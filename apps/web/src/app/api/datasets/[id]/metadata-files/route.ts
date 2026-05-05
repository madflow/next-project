import { NextResponse } from "next/server";
import { assertAccess } from "@/dal/dataset";
import { listByDataset } from "@/dal/dataset-metadata";
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

    const { limit, offset, search, orderBy, filters } = processUrlParams(new URL(request.url).searchParams);
    const result = await listByDataset(id, {
      filters,
      limit,
      offset,
      orderBy,
      search,
      searchColumns: ["name", "description"],
    });

    return NextResponse.json(result);
  } catch (error) {
    return raiseExceptionResponse(error);
  }
}
