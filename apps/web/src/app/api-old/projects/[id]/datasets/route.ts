import { NextResponse } from "next/server";
import { processUrlParams } from "@/app/api/handler";
import { listByProject } from "@/dal/dataset-project";
import { assertAccess } from "@/dal/project";
import { raiseExceptionResponse } from "@/lib/exception";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    await assertAccess(id);

    try {
      const { filters, limit, offset, search, orderBy } = processUrlParams(new URL(request.url).searchParams);

      const filtersWithProjectId = [
        ...filters,
        {
          column: "projectId",
          operator: "eq",
          value: id,
        },
      ];
      const result = await listByProject({
        filters: filtersWithProjectId,
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
