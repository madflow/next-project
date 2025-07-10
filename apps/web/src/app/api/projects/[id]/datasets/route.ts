import { NextResponse } from "next/server";
import { processUrlParams } from "@/app/api/handler";
import { listByProject } from "@/dal/dataset-project";
import { find } from "@/dal/project";
import { raiseExceptionResponse } from "@/lib/exception";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const entity = await find(id);

    if (!entity) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    try {
      const { limit, offset, search, orderBy } = processUrlParams(new URL(request.url).searchParams);

      const result = await listByProject({
        limit,
        offset,
        search,
        searchColumns: ["datasets:name"],
        orderBy,
      });

      return NextResponse.json(result);
    } catch (error: unknown) {
      return raiseExceptionResponse(error);
    }
  } catch (error) {
    return raiseExceptionResponse(error);
  }
}
